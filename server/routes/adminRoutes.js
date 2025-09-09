import express from 'express';
import { ProtectAdmin } from '../middleware/auth.js';
import { getAllBookings, getAllShows, getDashboardData, isAdmin } from '../contollers/adminController.js';

const adminRouter=express.Router()
adminRouter.get('/is-admin',ProtectAdmin,isAdmin)
adminRouter.get('/dashboard',ProtectAdmin,getDashboardData)
adminRouter.get('/all-shows',ProtectAdmin,getAllShows)
adminRouter.get('/all-bookings',ProtectAdmin,getAllBookings)

export default adminRouter;