import express from 'express'
import { createBooking, getOccuupiedSeats } from '../contollers/bookingContoller.js';

const bookingRouter=express.Router();

bookingRouter.post('/create',createBooking)
bookingRouter.get('/seats/:showId',getOccuupiedSeats)

export default bookingRouter;