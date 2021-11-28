var express = require('express');
var router = express.Router();
const rzp = require('razorpay')
const crypto = require('crypto')
const bp = require('body-parser')
const admin = require('firebase-admin')
const dotenv = require('dotenv').config()

admin.initializeApp({
  credential: admin.credential.cert({
    "type": process.env.TYPE.trim(),
    "project_id": process.env.PROJECT_ID.trim(),
    "private_key_id": process.env.PROJECT_KEY_ID.trim(),
    "private_key": process.env.PRIVATE_KEY.replace(/\\n/g, '\n').trim(),
    "client_email": process.env.CLIENT_EMAIL.trim(),
    "client_id": process.env.CLIENT_ID.trim(),
    "auth_uri": process.env.AUTH_URI.trim(),
    "token_uri": process.env.TOKEN_URI.trim(),
    "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_CERT_URL.trim(),
    "client_x509_cert_url": process.env.CLIENT_CERT_URL.trim()
  })
});

const rz_key = {
  key_id: process.env.RZ_KEY_ID.trim(),
  key_secret: process.env.RZ_KEY_SECRET.trim()
}


const instance = new rzp(rz_key);
router.get('/', (req, res) => {
  res.send("hi")
})
router.post("/create_order", async (req, res) => {
  console.log(req.body);
  var amount = req.body.amount;
  var order_data = req.body.order_data;
  var user_id = req.body.user_id;
  var user_name = req.body.user_name;
  var phone = req.body.phone;
  var email = req.body.email;
  console.log("hi", order_data);
  if (amount && parseInt(amount)) {
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "USER ID: " + user_id,
    };

    var order_id = null;


    await instance.orders.create(options, async (err, order) => {
      if (err) {
        console.log(err);
      } else {
        order_id = order.id;
        // return order_id
      }
    });

    if (!order_id) {
      res.json({ code: 400, msg: "Error - Razorpay order id not generated" });
      return;
    }

    try {
      await admin.firestore().collection("orders").doc(order_id).set({
        user_id: user_id,
        user_name: user_name,
        payment_id: "",
        cart: order_data,
        amount: amount,
        completed: false,
        email: email,
        phone: phone,
        time: new Date(),
      });
      res.json({
        code: 200,
        msg: "success",
        order_id: order_id
      });
    } catch (err) {
      console.log(err);
      res.json({
        code: 400,
        msg: "Error -  order is added to orders collection",
        error: err
      });
      return;
    }
    // res.json({ order_id: order_id, code: 200 });
  } else {
    console.log("Error - Order data not received");
    res.json({
      msg: "Error - Order data not received",
      code: 401,
    });
  }
});

async function get_order(order_id) {
  var data = null;
  await admin
    .firestore()
    .collection("orders")
    .doc(order_id)
    .get()
    .then((resp) => {
      data = resp.data();
      return data;
    })
    .catch((e) => console.log(e));

  return data;
}
async function get_user(uuid) {
  var data = null;
  await admin
    .firestore()
    .collection("users")
    .doc(uuid)
    .get()
    .then((resp) => {
      data = resp.data();
      return data;
    })
    .catch((e) => console.log(e));

  return data;
}

router.post("/verify_order", async (req, res) => {
  var signature = req.body.razorpay_signature;
  var razorpay_res_order_id = req.body.razorpay_order_id;
  var payment_id = req.body.razorpay_payment_id;
  var event_name = req.body.event;
  var uuid = req.body.uuid;
  var data = await get_order(razorpay_res_order_id);
  var user = await get_user(uuid)
  if (data) {
    if (
      signature ===
      crypto
        .createHmac("SHA256", rz_key.key_secret)
        .update(razorpay_res_order_id + "|" + payment_id)
        .digest("hex")
    ) {
      await admin
        .firestore()
        .collection("orders")
        .doc(razorpay_res_order_id)
        .update({ payment_id: payment_id, completed: true });

      if (event_name == "MUN with Training Program") {
        await admin
          .firestore()
          .collection("users")
          .doc(uuid)
          .update({ isPayment: true, isMUN: true });

        await admin.firestore().collection("MUN").doc(uuid).set({
          name: user.name,
          email: user.email,
          phone: user.phone

        });
      } else if (event_name == "Training Program") {
        await admin
          .firestore()
          .collection("users")
          .doc(uuid)
          .update({ isPayment: true, isTraining: true });

        await admin.firestore().collection("Training").doc(uuid).set({
          name: user.name,
          email: user.email,
          phone: user.phone
        });
      }

      res.json({ code: 200, msg: "payment success" });
    } else {
      res.json({
        msg: "Capturing failed - signature not matched",
        code: 401,
      });
    }
  } else {
    res.json({
      msg: "Capturing failed - order_id not found",
      code: 404,
    });
  }
});



router.post("/free_reg", async (req, res) => {
  var uuid = req.body.uuid;
  var user = await get_user(uuid)
  if (user) {
    await admin
      .firestore()
      .collection("users")
      .doc(uuid)
      .update({ isPayment: true, isFreeTraining: true });

    await admin.firestore().collection("FreeTraining").doc(uuid).set({
      name: user.name,
      email: user.email,
      phone: user.phone

    });
    res.json({ code: 200, msg: "payment success" });
  } else {
    res.json({
      msg: "No user found",
      code: 404,
    });
  }
});

module.exports = router;
