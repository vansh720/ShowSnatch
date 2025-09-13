import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './Pages/Home'
import Navbar from './components/Navbar'
import Movie from './Pages/Movie'
import Moviedetails from './Pages/Moviedetails'
import Seatslayout from './Pages/Seatslayout'
import Mybooking from './Pages/Mybooking'
import Faviourites from './Pages/Faviourites'
import Footer from './components/Footer'
import {Toaster} from 'react-hot-toast'
import Layout from './Pages/admin/Layout'
import Dashboard from './Pages/admin/Dashboard'
import AddShows from './Pages/admin/AddShows'
import ListShows from './Pages/admin/ListShows'
import ListBookings from './Pages/admin/ListBookings'
import { useAppContext } from './context/AppContext'
import { SignIn } from '@clerk/clerk-react'
import Loading from './components/Loading'

const App = () => {
  const isAdminRoute= useLocation().pathname.startsWith('/admin')
  const{user}=useAppContext()
  return (
    <>
      <Toaster/>
      {!isAdminRoute && <Navbar/>}
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/movie' element={<Movie/>}/>
        <Route path='/movie/:id' element={<Moviedetails/>}/>
        <Route path='/movie/:id/:date' element={<Seatslayout/>}/>
        <Route path='/MyBooking' element={<Mybooking/>}/>
        <Route path='/loading/:nextUrl' element={<Loading/>}/>
        <Route path='/faviourites' element={<Faviourites/>}/>
        <Route path='/admin/*' element={user ? <Layout/>: (
          <div className='min-h-screen flex justify-center items-center'>
            <SignIn fallbackRedirectUrl={'/admin'}/>
          </div>
        )}>
          <Route index element={<Dashboard/>}/>
          <Route path='add-shows' element={<AddShows/>}/>
          <Route path='list-shows' element={<ListShows/>}/>
          <Route path='list-bookings' element={<ListBookings/>}/>
        </Route>
      </Routes>
      {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App
