import React from 'react'
import SuggestionCard from './SuggestionCard'

const HomeRight = () => {
  return (
    <div className=''>
    <div>
      <div className='flex justify-between items-center'>
      </div> 
      <div className='space-y-5 mt-10'>
          {[1,1,1,1].map((item)=><SuggestionCard/>)}
        </div>
    </div>

  </div>
  )
}

export default HomeRight