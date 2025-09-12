import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { model } from "mongoose";
import sendEmail from "../configs/nodeMailer.js";

export const inngest = new Inngest({ id: "movie-ticket-booking" });


//to create
const syncUserCreation=inngest.createFunction(
    {id:'sync-user-from-clerk'},
    {event:'clerk/user.created'},
    async({event})=>{
           const {id,first_name,last_name,email_addresses,image_url}=event.data
           const userData ={
            _id:id,
            email:email_addresses[0].email_address,
            name:first_name+ ' ' + last_name,
            image:image_url
           }
           await User.create(userData)
    }
)

//to delete
const syncUserDeletion=inngest.createFunction(
    {id:'delete-user-with-clerk'},
    {event:'clerk/user.deleted'},
    async({event})=>{
           const {id}=event.data
           await User.findByIdAndDelete(id)
    }
)

//to update
const syncUserUpdation=inngest.createFunction(
    {id:'update-user-fromclerk'},
    {event:'clerk/user.updated'},
    async({event})=>{
           const {id,first_name,last_name,email_addresses,image_url}=event.data
           const userData ={
            _id:id,
            email:email_addresses[0].email_address,
            name:first_name+ ' ' + last_name,
            image:image_url
           }
           await User.findByIdAndUpdate(id,userData)
    }
)

//inngest function to cancel booking and release seats of show after 10 minutes
const releaseSeatsAndDeleteBooking=inngest.createFunction(
    {id:'release-seats-delete-booking'},
    {event:'app/checkpayment'},
    async({event,step})=>{
      const tenMinutesLater=new Date(Date.now()+10*60*1000)
      await step.sleepUntil('wait-for-10-minutes',tenMinutesLater)

      await step.sleepUntil('check-payment-status',async()=>{
        const bookingId =event.data.bookingId;
        const booking =await Booking.findById(bookingId)

        //if payment is not made,release seats and delete booking
        if(!booking.isPaid){
            const show = await Show.findById(booking.show)
            booking.bookedSeats.forEach(()=>{
                delete show.occupiedSeats[seat]
            })
            show.markModified('occupiedSeats')
            await show.save()
            await Booking.findByIdAndDelete(booking._id)
        }
      })
    }
)

// In your Inngest function file

 const sendBookingConfirmationEmail=inngest.createFunction(
  { id: 'send-booking-confirmation-email' },
  { event: 'app/show.booked' },
  async ({ event, step }) => {
    try {
      const { bookingId } = event.data;
      console.log(`[Inngest] Function started for bookingId: ${bookingId}`);

      const booking = await Booking.findById(bookingId)
        .populate({
          path: 'show',
          populate: { path: 'movie', model: 'Movie' }
        })
        .populate('user');

      // ❗ CRITICAL CHECK 1: Did we find the booking?
      if (!booking) {
        console.error(`[Inngest] CRITICAL: Booking not found for ID: ${bookingId}`);
        return; // Stop the function here
      }

      // ❗ CRITICAL CHECK 2: Was the user populated and do they have an email?
      if (!booking.user || !booking.user.email) {
        console.error(`[Inngest] CRITICAL: User or user email not found for bookingId: ${bookingId}`);
        // Log the whole booking object to see what data you actually have
        console.log('[Inngest] Booking data:', JSON.stringify(booking, null, 2));
        return; // Stop the function here
      }
      
      console.log(`[Inngest] Found user email: ${booking.user.email}. Preparing to send.`);

      const emailBody=`<div style="font-family: Arial,sans-serif; line-heightL1.5;">
            <h2>Hi ${booking.user.name},</h2>
            <p>Your Booking for <strong style="color:#F84565;">"${booking.show.movie.title}"</strong> is confirmed.</p>
            <p>
                <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US',{timezone:'Asia/Kolkata'})}<br/>
                <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US',{timeZone:'Asia/Kolkata'})}
            </p>
            <p>Enjoy the show!</p>
            <p>Thanks for booking with us!<br/>-ShowSnatch Team</p>
            </div>`

      // Now it's safe to call sendEmail
      await sendEmail({
        to: booking.user.email,
        subject: `Payment Confirmation: ${booking.show.movie.title} booked!`,
        body:emailBody
      });

      console.log(`[Inngest] Email sent successfully to: ${booking.user.email}`);

    } catch (error) {
      console.error('[Inngest] An unexpected error occurred:', error);
      throw error;
    }
  }
);



export const functions=[syncUserCreation,syncUserDeletion,syncUserUpdation,releaseSeatsAndDeleteBooking,sendBookingConfirmationEmail];
