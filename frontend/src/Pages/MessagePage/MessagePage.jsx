import React from 'react'
import MessageLeft from '../../Components/MessageComponets/MessageLeft/MessageLeft'
import MessageRight from '../../Components/MessageComponets/MessageRight/MessageRight'

const MessagePage = () => {
  return (
    <div className='flex'>
        <div className='w-[23%] border border-;-slate-500'>
            <MessageLeft/>
            
        </div>
        <div className='w-full'>
            <MessageRight/>
        </div>
    </div>
  )
}

export default MessagePage