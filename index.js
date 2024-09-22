const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server to integrate with both Express and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};
app.use(cors(corsConfig));
app.use(express.json());

const sendEmail = (transporter, mailOptions) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
};

// Nodemailer email sending route
app.post(`/api/contact`, async (req, res) => {
  const { recipients, message } = req.body;

  const transporter1 = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER1,
      pass: process.env.EMAIL_PASS1,
    },
  });

  const transporter2 = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER2,
      pass: process.env.EMAIL_PASS2,
    },
  });

  const sendEmails = async () => {
    const totalEmails = recipients.length;
    const emailsPerTransporter = 500; // Send 500 emails per transporter
    let emailCount = 0;

    for (let i = 0; i < totalEmails; i++) {
      const recipient = recipients[i];
      const transporter =
        Math.floor(i / emailsPerTransporter) % 2 === 0
          ? transporter1
          : transporter2; // Alternate between transporter1 and transporter2

      const mailOptions = {
        from: `"Ava" <${transporter.options.auth.user}>`,
        to: recipient,
        subject: "",
        text: message,
      };

      try {
        const info = await sendEmail(transporter, mailOptions);
        console.log("Email sent to:", recipient, "Info:", info);
        emailCount++;
      } catch (error) {
        console.error("Error sending email to:", recipient, "Error:", error);
      }

      // Introduce a delay between sending emails
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5-second delay
    }

    res
      .status(200)
      .send({ message: `${emailCount} messages sent successfully` });
  };

  sendEmails().catch((error) => {
    console.error("Error in sendEmails:", error);
    res.status(500).send({ message: "Failed to send the messages" });
  });
});

// Seat booking system with 5 groups, 5 seats each
let seatGroups = [
  { group: 1, seats: Array(5).fill(false) }, // 5 seats in group 1
  { group: 2, seats: Array(5).fill(false) }, // 5 seats in group 2
  { group: 3, seats: Array(5).fill(false) }, // 5 seats in group 3
  { group: 4, seats: Array(5).fill(false) }, // 5 seats in group 4
  { group: 5, seats: Array(5).fill(false) }, // 5 seats in group 5
];

// Socket.io connection for real-time seat booking
io.on("connection", (socket) => {
  console.log("New client connected");

  // Send the current seat status to the newly connected client
  socket.emit("seatStatus", seatGroups);

  // Listen for seat booking request
  socket.on("bookSeat", ({ groupId, seatIndex }) => {
    const group = seatGroups.find((g) => g.group === groupId);

    // Check if seat is available and not already booked
    if (group && !group.seats[seatIndex]) {
      group.seats[seatIndex] = true; // Mark seat as booked

      // Broadcast updated seat status to all clients
      io.emit("seatStatus", seatGroups);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

io.on("connection", (socket) => {
  console.log("New client connected");

  // Send the current seat status to the newly connected client
  socket.emit("seatStatus", seatGroups);

  // Listen for seat booking request
  socket.on("bookSeat", ({ groupId, seatIndex }) => {
    const group = seatGroups.find((g) => g.group === groupId);

    // Check if seat is available and not already booked
    if (group && !group.seats[seatIndex]) {
      group.seats[seatIndex] = true; // Mark seat as booked

      // Broadcast updated seat status to all clients
      io.emit("seatStatus", seatGroups);
    }
  });

  // Listen for chat messages
  socket.on("sendMessage", (message) => {
    // Broadcast the message to all connected clients
    io.emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Basic route for testing the server
app.get("/", (req, res) => {
  res.send("Email and Seat Booking server running");
});

// Start the server with Socket.io support
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
