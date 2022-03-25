# This Chat is Lit! And Ceramic of course!

Welcome to LitChat!

Each message sent in Lit Chat is only viewable by the sender, and the receiver.  This is made possible by access conditions set in the Lit Protocol.  All the data is stored using Ceramic.

Chat Features:
- Send/Receive messages to wallet address (currently using Polygon Mainnet)
- Choose to send message read reciept
- Unsend message functionality (receiver can no longer decrypt the stream, access conditions are changed in Lit protocol)

Imporant Links:
Deployed APP:
https://lit-chat-m8iga.ondigitalocean.app/

Delete a message:
curl --request DELETE https://litchatrestapi.herokuapp.com/users/4

Simple REST API used for Stream ID coordination:
https://litchatrestapi.herokuapp.com/users

Refer to https://github.com/LIT-Protocol/CeramicIntegration) for addtional details on the underlying core libraries.
Apache-2.0 OR MIT
