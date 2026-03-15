import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { supabaseAdmin } from "@/app/lib/supabaseAdmin"

const MODELO_ALIASES: Record<string, string> = {
  "lost marry 35k":  "lost mary 35k",
  "lost marry 5k":   "lost mary 5k",
  "waka 8 mil hits": "waka 8k",
  "vhill 12":        "vhill 12k",
  "iplay big max":   "iplay max 5k",
}

const SABOR_ALIASES: Record<string, string> = {
  "rasbperry pb":          "raspberry pb",
  "blueberry splash":      "bluberry splash",
  "blackberyy ice":        "blackberry ice",
  "watermelon bublegum":   "watermelon bubblegum",
  "red bom":               "red bomb",
  "white gammy":           "white gummy",
  "pink":                  "pink lemonade",
  "peach bluerasberry":    "peach blueraspberry",
  "blue razz black berry": "blue razz",
  "strwberry banana":      "strawberry banana",
  "bluberry mint":         "blueberry mint",
  "coconut mmilk":         "coconut milk",
  "bluberry min":          "blueberry mint",
  "BlackBerry Ice":        "black berry ice",
  "blackberry ice":         "black berry ice",
}

const STOP_WORDS = new Set(["TOTAL", "STOCK MERIDA", "STOCK"])
const JUNK_SABORES = new Set(["sabor disponible", "total", "stock", "stock merida"])

function normalizeModelo(raw: string): string {
  const lower = raw.toLowerCase().trim()
  return MODELO_ALIASES[lower] ?? lower
}
function normalizeSabor(raw: string): string {
  const lower = raw.toLowerCase().trim()
  return SABOR_ALIASES[lower] ?? lower
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer)

    if (formData.get("getSheets") === "true") {
      return NextResponse.json({ sheets: workbook.SheetNames })
    }

    const sheetName = formData.get("sheetName") as string | null
    const targetSheet = sheetName && workbook.SheetNames.includes(sheetName)
      ? sheetName
      : workbook.SheetNames[0]

    const sheet = workbook.Sheets[targetSheet]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][]

    // Find all MODELO header blocks
    type Block = { headerRow: number; modeloCol: number; saborCol: number; cantCol: number }
    const blocks: Block[] = []

    rows.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (cell?.toString().trim() === "MODELO") {
          // ✅ Find the FIRST SABOR DISPONIBLE strictly within 5 cols (not 15)
          // This prevents grabbing the next block's SABOR header
          let saborCol = -1
          let cantCol = -1
          for (let k = colIdx + 1; k < Math.min(colIdx + 6, row.length); k++) {
            const v = row[k]?.toString().trim()
            if (v === "SABOR DISPONIBLE" && saborCol === -1) saborCol = k
          }
          // CANTIDAD must come after SABOR but within 8 cols of MODELO
          for (let k = (saborCol !== -1 ? saborCol + 1 : colIdx + 1); k < Math.min(colIdx + 10, row.length); k++) {
            const v = row[k]?.toString().trim()
            if (v === "CANTIDAD" && cantCol === -1) cantCol = k
          }
          if (saborCol !== -1 && cantCol !== -1) {
            blocks.push({ headerRow: rowIdx, modeloCol: colIdx, saborCol, cantCol })
          }
        }
      })
    })

    const extracted: { modelo: string; sabor: string; stock: number }[] = []

    for (const block of blocks) {
      let currentModelo: string | null = null
      let emptyModeloRows = 0  // ✅ Track consecutive rows with no modelo name

      for (let r = block.headerRow + 1; r < rows.length; r++) {
        const row = rows[r]
        const modeloRaw = row[block.modeloCol]?.toString().trim()
        const saborRaw  = row[block.saborCol]?.toString().trim()
        const cantRaw   = row[block.cantCol]

        // Stop on terminator keywords in modelo column
        if (modeloRaw && STOP_WORDS.has(modeloRaw.toUpperCase())) break
        // Stop on terminator keywords in sabor column
        if (saborRaw && STOP_WORDS.has(saborRaw.toUpperCase())) break
        // Stop if modelo column has a new MODELO header (next block starting)
        if (modeloRaw?.toUpperCase() === "MODELO") break

        // ✅ Stop if modelo column has been empty too long — means we've drifted
        // into another block's rows (like waka 8k bleeding into vhill 3k rows)
        if (!modeloRaw) {
          emptyModeloRows++
          // Allow up to 8 consecutive empty modelo rows (for blocks that don't repeat modelo name)
          // But if sabor column also has no value, it's truly empty — don't count it
          if (saborRaw && emptyModeloRows > 8) break
        } else {
          emptyModeloRows = 0  // Reset counter when modelo appears
          currentModelo = modeloRaw
        }

        // Skip junk sabor rows
        if (saborRaw && JUNK_SABORES.has(saborRaw.toLowerCase())) continue
        // Skip rows with sabor but no cantidad
        if (saborRaw && (cantRaw === null || cantRaw === undefined)) continue
        if (!currentModelo || !saborRaw) continue

        const stock = parseInt(String(cantRaw), 10)
        if (isNaN(stock)) continue

        extracted.push({
          modelo: normalizeModelo(currentModelo),
          sabor:  normalizeSabor(saborRaw),
          stock,
        })
      }
    }

    if (extracted.length === 0) {
      return NextResponse.json({ error: "No valid data found in file" }, { status: 400 })
    }

    // Fetch productos and build lookup map
    const { data: productosDB, error: productosError } = await supabaseAdmin
      .from("productos")
      .select("id, sabor, modelo")
    if (productosError) throw productosError

    const productoMap = new Map<string, number>()
    for (const p of productosDB ?? []) {
      const key = `${p.modelo.toLowerCase().trim()}:${p.sabor?.toLowerCase().trim()}`
      productoMap.set(key, p.id)
    }

    const updates: { id: number; stock: number }[] = []
    const notFound: { modelo: string; sabor: string }[] = []

    for (const item of extracted) {
      const key = `${item.modelo}:${item.sabor}`
      const productoId = productoMap.get(key)
      if (!productoId) { notFound.push(item); continue }
      updates.push({ id: productoId, stock: item.stock })
    }

    let updatedCount = 0
    for (const update of updates) {
      const { error } = await supabaseAdmin
        .from("productos")
        .update({ stock: update.stock })
        .eq("id", update.id)
      if (!error) updatedCount++
    }

    return NextResponse.json({
      success: true,
      sheet: targetSheet,
      extracted: extracted.length,
      updated: updatedCount,
      notFound: notFound.length,
      notFoundList: notFound,
    })

  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}