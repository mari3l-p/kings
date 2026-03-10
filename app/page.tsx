import Link from "next/link";
import BigBtn from "./components/BigBtn";
import Image from "next/image";
import PromoImg from "./components/PromoImg";
import MasVendidos from "./components/MasVendido";



export default function Home() {

  
  
  return (<>
    <div className="xl:flex md:items-center justify-between my-19 px-6 md:px-25">
      <div>
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

      <div>
        <Image
          src="/heroPic.png"
          alt="heroImg smoking"
          width={500}
          height={500}
          className="md:h-150 md:w-125 rounded-sm"
        >

        </Image>
      </div>
    </div>

    <div>
      <PromoImg/>
    </div>
    <MasVendidos/>
    </>
  );
}
