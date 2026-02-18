import { Search, ShoppingCart, Menu, Crown } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {

    const navOptions = [
        {icon: "Search", }
    ]

    return(
        <nav className='flex justify-between px-6 md:px-12 pt-15 pb-5 border-b border-b-(--pink)'>

            <Link href={"/"} className='flex items-center gap-3'>
                <Crown color='#D2AE0A'/>

                <div>
                    <h1 className='w-30 md:w-fit text-(--rose-pink) font-bold leading-none tracking-tighter text-2xl [-webkit-text-stroke:1px_#FF008C]'>THE VAPE KINGS</h1>
                    <p className='text-xs'>Experiencia premium</p>
                </div>
            </Link>

            <div className='flex items-center gap-3'>
                <Search/>
                <ShoppingCart/>
                <Menu/>
            </div>
        </nav>
    )
}