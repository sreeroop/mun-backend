# mun-backend

```bash
#install pkgs

npm i

#run app

npm start
```


1) ExpreeJS used as Server.
2) Cors added to avoid cors error and whitelisted webiste url.
3) Firebase-admin is used to write data to firestore.
4) Razorpay is used for payment integration
5)  Process <br/>
    a) First client request for create_order , server will return order id. <br/>
    b) upon completing the payment, the client will sent a post request will payment id and signature <br/>
    c) using crypto server check wheather the payment is legit or not. <br/>
    d) If the payment is legit server will write record to firebase and send email to delegate. <br/>
