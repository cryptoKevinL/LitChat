import { DID } from 'dids'
import { Integration } from '../lit-ceramic-sdk'

declare global {
  interface Window {
    did?: DID
  }
}

let restApiUrl = 'https://litchatrestapi.herokuapp.com/users'
let litCeramicIntegration = new Integration('https://ceramic-clay.3boxlabs.com', 'polygon')

let streamID = 'this should never work' // test data
let selectedWalletAddress = "none"

const updateAlert = (status: string, message: string) => {
  const alert = document.getElementById('alerts')

  if (alert !== null) {
    alert.textContent = message
    alert.classList.add(`alert-${status}`)
    alert.classList.remove('hide')
    setTimeout(() => {
      alert.classList.add('hide')
    }, 5000)
  }
}

const fetchPost = (data) => {
  fetch(` ${restApiUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then((response) => response.json())
  //Then with the data from the response in JSON...
  .then((data) => {
    console.log('$$$kl - Post to REST API:', data);
  })
  //Then with the error genereted...
  .catch((error) => {
    console.error('Post to REST API error!!!!!!!!!!!!:', error);
  });
}

const fetchPut = (data, id) => {
  fetch(` ${restApiUrl}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then((response) => response.json())
  //Then with the data from the response in JSON...
  .then((data) => {
    console.log('$$$kl - PUT to REST API:', data);
  })
  //Then with the error genereted...
  .catch((error) => {
    console.error('PUT to REST API error!!!!!!!!!!!!:', error);
  });
}

const updateStreamID = (resp: string | String) => {
  streamID = resp as string
  console.log('$$$kl - you now have this as your streamID', streamID)

  //Obj of data to send in future like a dummyDb
  const sendToAddress = document.getElementById('sendaddr').value;
  const commonName = document.getElementById('myname').value;
  const data = { streamID: `${streamID}`, fromName: `${commonName}`, fromAddr: `${selectedWalletAddress}`, toAddr: `${sendToAddress}`, read: false };
  //POST request with body equal on data in JSON format
  fetchPost(data)
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOMContent.........')
  litCeramicIntegration.startLitClient(window)
})

function addMessageReceiver(message, fromName){
    const div = document.createElement("div");
    div.className = "container"
    const para = document.createElement("p");
    const node = document.createTextNode(`${message}`);
    var mainspan = document.createElement('span');
    mainspan.setAttribute('class', 'time-left');
    const timeText = document.createTextNode(`${fromName}`);
    mainspan.appendChild(timeText)
    para.appendChild(node);  
    div.appendChild(para)
    div.appendChild(mainspan)
    const element = document.querySelector('main');
    element.append(div)  
}

function addMessageSender(message, fromName, wasRead){
    const div = document.createElement("div");
    div.className = "container darker"
    const para = document.createElement("p");
    let node;
    if(wasRead)
       node = document.createTextNode(`${message}` + " (READ)");
    else
       node = document.createTextNode(`${message}` + " (unread)");
    var mainspan = document.createElement('span');
    mainspan.setAttribute('class', 'time-right');
    let timeText = document.createTextNode(`${fromName}`);
    mainspan.appendChild(timeText)
    para.appendChild(node);  
    div.appendChild(para)
    div.appendChild(mainspan)
    const element = document.querySelector('main');  
    element.append(div)
}

function clearMessages() {
  //$("#main").load(" #main > *");
  location.reload()
}

document.getElementById('readCeramic')?.addEventListener('click', () => {
  try {
    selectedWalletAddress = window.ethereum.selectedAddress
    console.log('$$$kl - Selected Address:', selectedWalletAddress);

    updateChatData();
  }
  catch {
    updateAlert('danger', `"Please Ensure You have MetaMask installed and connected"`) 
  }
})

function updateChatData(){
    //hacky for now, but what can you do in a week...
    //clearMessages();
    //location.reload();

    //GET request to get off-chain data for RX user
    fetch(` ${restApiUrl}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then((response) => response.json())
    //Then with the data from the response in JSON...
    .then((data) => {
      //console.log('$$$kl - GET to REST API:', data);

    // @ts-ignore
    //const test = document.getElementById('sendaddr').value;
    for(let i=0; i<data.length; i++){
      const streamToDecrypt = data[i].streamID
      if(data[i].toAddr.toLowerCase() == selectedWalletAddress.toLowerCase()) {
        console.log('$$$kl - this is the TO streamID youre decrypting: ', streamToDecrypt)
        const response = litCeramicIntegration.readAndDecrypt(streamToDecrypt).then(
          (value) => (addMessageReceiver(value + "\n", data[i].fromName))
        )

        //mark as read if box is checked
        if(document.getElementById('readReceipts').checked) {
          console.log('$$$kl - marking READ for streamID: ', streamToDecrypt)
          const putData = { streamID: `${data[i].streamID}`, fromName: `${data[i].fromName}`, fromAddr: `${data[i].fromAddr}`, toAddr: `${data[i].toAddr}`, read: true }
          fetchPut(putData, data[i].id)
        }
        else {
          console.log('$$$kl - read receipts is not checked, going rogue')
        }
      }
      //print sent messages
      if(data[i].fromAddr.toLowerCase() == selectedWalletAddress.toLowerCase()) {
        console.log('$$$kl - this is the FROM streamID youre decrypting: ', streamToDecrypt)
        const response = litCeramicIntegration.readAndDecrypt(streamToDecrypt).then(
          (value) => (addMessageSender(value + "\n", data[i].fromName, data[i].read))
        )
      }
    }

    })
    //Then with the error genereted...
    .catch((error) => {
      updateAlert('danger', `"Please Ensure You have MetaMask installed and connected"`)
      console.error('GET to REST API error!!!!!!!!!!!!:', error);
    });
}

// encrypt with Lit and write to ceramic
document.getElementById('encryptLit')?.addEventListener('click', function () {
  console.log('chain in litCeramicIntegration: ', litCeramicIntegration.chain)
  // @ts-ignore
  selectedWalletAddress = window.ethereum.selectedAddress
  console.log('$$$kl - Selected Address:', selectedWalletAddress);

  const stringToEncrypt = document.getElementById('secret').value;
  const sendToAddress = document.getElementById('sendaddr').value;
  console.log(`$$$kl - + ${sendToAddress}`)

  const accessControlConditions = [
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'polygon',
      method: '',
      parameters: [
        ':userAddress',
      ],
      returnValueTest: {
        comparator: '=',
        value: `${sendToAddress}`
      }
    },
    {"operator": "or"},
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'polygon',
      method: '',
      parameters: [
        ':userAddress',
      ],
      returnValueTest: {
        comparator: '=',
        value: `${selectedWalletAddress}`
      }
    }
  ]

  const response = litCeramicIntegration
    .encryptAndWrite(stringToEncrypt, accessControlConditions)
    .then((value) => updateStreamID(value))
  console.log(response)

  updateChatData();
})


// encrypt with Lit and write to ceramic
document.getElementById('deleteMessage')?.addEventListener('click', function () {
  // @ts-ignore
  selectedWalletAddress = window.ethereum.selectedAddress
  console.log('$$$kl - unsending message from:', selectedWalletAddress);
  
  const sendToAddress = document.getElementById('sendaddr').value;
  const newAccessControlConditions = [
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'polygon',
      method: '',
      parameters: [
        ':userAddress',
      ],
      returnValueTest: {
        comparator: '=',
        value: `${sendToAddress}`
      }
    },
    {"operator": "or"},
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'polygon',
      method: '',
      parameters: [
        ':userAddress',
      ],
      returnValueTest: {
        comparator: '=',
        value: `${selectedWalletAddress}`
      }
    }
  ]

  const idToChange = document.getElementById('unsendmsg').value;
  console.log('$$$kl - ID to Change:', idToChange);

  //get the streamID of message id: N
  //GET request to get off-chain data for RX user
  fetch(` ${restApiUrl}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .then((response) => response.json())
  //Then with the data from the response in JSON...
  .then((data) => {
    // @ts-ignore
    for(let i=0; i<data.length; i++){
        const streamToUpdate = data[i].streamID
        if(data[i].id == idToChange) {
          console.log('$$$kl - this is the streamID youre updating permissions on: ', streamToUpdate)
          
          const newEncryptedSymmetricKey =
          litCeramicIntegration.updateAccess(streamToUpdate, newAccessControlConditions).then((value) => console.log(value));
        }
      }
    }
  );
})
