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

// Function to send email

 const sendBookingConfirmationEmail=inngest.createFunction(
  { id: 'send-booking-confirmation-email' },
  { event: 'app/show.booked' },
  async ({ event, step }) => {
    try {
      const { bookingId } = event.data;

      const booking = await Booking.findById(bookingId)
  .populate({
    path: 'show',
    populate: { path: 'movie', model: 'Movie' }
  })
  .populate('user');

if (!booking) {
  console.error("❌ Booking not found for ID:", bookingId);
  return;
}

if (!booking.user) {
  console.error("❌ User not found for booking:", bookingId);
  return;
}

await sendEmail({
  to: booking.user.email,
  subject: `Payment Confirmation: ${booking.show.movie.title} booked!`,
  body: `
    <h2>Hi ${booking.user.name}</h2>
    <p>Your booking for <strong>${booking.show.movie.title}</strong> is confirmed.</p>
    <p><strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
    <p><strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
    <p>Enjoy the show!</p>
    <p>Thanks for booking with us!<br>– ShowSnatch Team</p>
  `
});

console.log(`✅ Email sent successfully to: ${booking.user.email}`);


    } catch (error) {
      console.error('[Inngest] An unexpected error occurred:', error);
      throw error;
    }
  }
);

//Inngest to send reminders
const sendShowRemainders=inngest.createFunction(
  {id:"send-show-reminders"},
  {cron:"0 */8 * * *"},
  async(step)=>{
    const now =new Date();
    const in8Hours=new Date(in8Hours.getTime()-10*60*1000)
    const windowStart=new Date(in8Hours.getTime()-10*60*1000);

    //prepare remainder tasks
    const remainderTasks=await step.run
    ("prepare-remainder-tasks",async()=>{
      const shows=await Show.find({
        showTime:{$gte:windowStart,$lte:in8Hours},
      }).populate('movie')

      const tasks=[];
      for(const show of shows){
        if(!show.movie|| !show.occupiedSeats) continue;

        const userIds=[...new Set(Object.values(show.occupiedSeats))]
        if(userIds.length===0) continue

        const users=await User.find({_id:{$in: userIds}}).select("name email")

        for(const user of users){
          tasks.push({
            userEmail:user.email,
            userName:user.name,
            movieTitle:show.movie.title,
            showTime:show.showTime,
          })
        }
      }
      return tasks;
    })
    if(remainderTasks.length===0){
      return {sent:0,message:"No reminders to send"}
    }

    const results=await step.run('send-all-remainders',async()=>{
      return await Promise.allSettled(
        remainderTasks.map(task=> sendEmail({
          to:task.userEmail,
          subject:`Reminder:Your movie "${task.movieTitle}" starts soon!`,
          body:""
        }))
      )
    })

    const sent=results.filter(r=>r.status==='fulfilled').length;
    const failed=results.length-sent;
    return{
      sent,
      failed,
      message:`Sent ${sent} reminder(s), ${failed} failed`
    }
  }
)

//Inngest function to send notifications when a new show is added
const sendNewShowNotifications=inngest.createFunction(
    {id:'send-new-show-notifications'},
    {event:'app/show.added'},
    async()=>{
      const{movieTitle}=event.data;

      const users=await User.find({})

      for(const user of users){
        const userEmail=user.email;
        const userName=user.name;

        const subject =`New Show Added: ${movieTitle}`;
        const body=``

      await sendEmail({
        to:userEmail,
        subject,
        body,
      })
    }

    return {message:'notification sent'}
    })


export const functions=[syncUserCreation,syncUserDeletion,syncUserUpdation,releaseSeatsAndDeleteBooking,sendBookingConfirmationEmail,sendShowRemainders,sendNewShowNotifications];
