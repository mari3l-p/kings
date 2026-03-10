import { CheckCircle2} from 'lucide-react'
import { useCart } from '../context/CartContext';

interface MsgSendProps {
  isOpen: boolean;
  onClose: () => void;
}

const MsgSend = ({ isOpen, onClose }: MsgSendProps) => {
  if (!isOpen) return null; // Si no está abierto, no renderiza nada

    const {resetCart} = useCart()
const handleReset = () => {
    onClose()
    resetCart()
    window.location.reload();
    
}

  return (
    <div className="fixed inset-0 z-800 flex items-center justify-center p-4">
      {/* Overlay: El fondo oscuro que bloquea la pantalla */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose} 
      />

      {/* Contenido del Modal */}
      <div className="relative bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-center mb-6">
          <div className="bg-[#25D366]/20 p-4 rounded-full">
            <CheckCircle2 size={60} className="text-[#25D366]" />
          </div>
        </div>

        <h1 className="font-bold text-3xl text-white mb-4">¡Pedido Enviado!</h1>
        
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Tu pedido ha sido procesado. Ahora continúa el seguimiento directamente en el chat de WhatsApp con el vendedor.
        </p>

        <button
          onClick={handleReset}
          className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
        >
          Entendido
        </button>
      </div>
    </div>
  )
}

export default MsgSend