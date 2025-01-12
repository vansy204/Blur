import React from 'react'
import MessageLeft from '../../Components/MessageComponets/MessageLeft/MessageLeft'
import MessageRight from '../../Components/MessageComponets/MessageRight/MessageRight'

const MessagePage = () => {
  return (
    <div className='flex'>
        <div className='w-[20%]'>
            <MessageLeft/>
        </div>
        <div>
            <MessageRight/>
        </div>
    </div>
  )
}

export default MessagePage