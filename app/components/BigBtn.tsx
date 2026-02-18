import { ArrowRight } from "lucide-react";

interface btnProps {
    text: string,
    borderColor: string,
    textColor: string,
    bgColor: string;
    margin: string,
    arrow: boolean,
}

export default function BigBtn({text, borderColor, textColor, bgColor, margin, arrow}: btnProps) {
    return(
        <button 
            className={`border ${borderColor} ${textColor} ${margin} 
                        w-full md:w-xl rounded-xl h-15
                        ${bgColor} hover:text-white hover:cursor-pointer`}>
            {text}{arrow ? <ArrowRight className="inline ml-4"/> : null}
        </button>
    )
}