import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/home'
import Navbar from './components/Navbar'
import Movie from './Pages/Movie'
import Moviedetails from './Pages/Moviedetails'
import Seatslayout from './Pages/Seatslayout'
import Mybooking from './Pages/mybooking'
import Faviourites from './Pages/faviourites'
import Footer from './components/Footer'
import {Toaster} from 'react-hot-toast'
import Layout from './Pages/admin/Layout'
import Dashboard from './Pages/admin/Dashboard'
import AddShows from './Pages/admin/AddShows'
import ListShows from './Pages/admin/ListShows'
import ListBookings from './Pages/admin/ListBookings'

const App = () => {
  const isAdminRoute= useLocation().pathname.startsWith('/admin')
  return (
    <>
      <Toaster/>
      {!isAdminRoute && <Navbar/>}
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/movie' element={<Movie/>}/>
        <Route path='/movie/:id' element={<Moviedetails/>}/>
        <Route path='/movie/:id/:date' element={<Seatslayout/>}/>
        <Route path='/my-bookings' element={<Mybooking/>}/>
        <Route path='/faviourites' element={<Faviourites/>}/>
        <Route path='/admin/*' element={<Layout/>}>
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
