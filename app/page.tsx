import Link from "next/link";
import BigBtn from "./components/BigBtn";

export default function Home() {
  return (
    <div className="mt-19 px-6 md:px-12">
      <div className="w-45 py-2 font-semibold bg-(--pink-15) text-center rounded-3xl text-lg md:text-xl text-(--pink-75) border border-(--pink-75)">
        Mérida
      </div>

      <h1 className="text-5xl md:text-8xl md:leading-30 mt-11 leading-15">
        <span className="text-white">Los Mejores</span><br />

        <span className="bg-linear-to-r from-(--pink) to-(--yellow) bg-clip-text text-transparent">
          Vapes a tu <br /> Alcance
        </span><br />
      </h1>

      <p className="font-medium text-(--gray) mt-6 md:w-xl">
        Vapes de alta gama y sabores únicos para elevar tu experiencia al siguiente nivel.
      </p>

      <Link href={"/catalogo"}>
        <BigBtn 
        text="Explorar Catalogo" borderColor="border-(--yellow)" 
        textColor="text-(--yellow)" bgColor="hover:bg-(--yellow)" margin="my-25" arrow={true}/>
      </Link>

    </div>
  );
}
