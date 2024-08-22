import { Button } from 'flowbite-react'
import React from 'react'

export default function CallToAction() {
  return (
    <div className='flex flex-col sm:flex-row p-3 border border-teal-500 justify-center items-center rounded-tl-3xl rounded-br-3xl text-center'>
        <div className='flex-1 justify-center flex flex-col' >
            <h2 className='text-2xl'>Want to learn more about Javascript</h2>
            <p className='text-gray-500 my-2'>Checkout these resources witt 100 Javascript Projects</p>
            <Button gradientDuoTone='purpleToPink' className='w-full rounded-tl-xl rounded-bl-none '><a href="https://www.100jsprojects.com" target='_blank' rel='noopener noreferrer'>
                100 Javascript Projects
            </a></Button>
        </div>
        <div className='p-7 flex-1'>
            <img src="https://imgs.search.brave.com/hSPHPTVFzcZMbct7-O3wV-Rk6krsp0ciRr6XHXDqK6w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZWVrc2Zvcmdl/ZWtzLm9yZy93cC1j/b250ZW50L3VwbG9h/ZHMvMjAyNDA3MDEx/NTAzNTAvSmF2YVNj/cmlwdC1UdXRvcmlh/bC1jb3B5LndlYnA" />

        </div>
    </div>
  )
}
 