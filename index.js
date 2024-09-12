const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const nodemailer = require("nodemailer");
const port = process.env.PORT || 3000;

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

app.post(`/api/contact`, async (req, res) => {
  const { recipients, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const sendEmails = async () => {
    for (const recipient of recipients) {
      const mailOptions = {
        from: `"Naiem Hasan" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: "Invitation to Join the EndGame Web Development Team Event",
        text: message,
      };

      try {
        const info = await sendEmail(transporter, mailOptions);
        console.log("Email sent to:", recipient, "Info:", info);
      } catch (error) {
        console.error("Error sending email to:", recipient, "Error:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000)); // 30-second delay
    }

    res.status(200).send({ message: "Messages sent successfully" });
  };

  sendEmails().catch((error) => {
    console.error("Error in sendEmails:", error);
    res.status(500).send({ message: "Failed to send the messages" });
  });
});

app.get("/", (req, res) => {
  res.send("Email server running");
});

app.listen(port, () => {
  console.log(`Email server running on port ${port}`);
});
