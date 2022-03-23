import { DID } from 'dids'
import { Integration } from 'lit-ceramic-sdk'

declare global {
  interface Window {
    did?: DID
  }
}

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
  fetch(' http://localhost:12345/users', {
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
  fetch(` http://localhost:12345/users/${id}`, {
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
  // @ts-ignore
  document.getElementById('stream').innerText = resp

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

// function addMessages(message){
//     $(“#decryption).append(`
//         <h4> ${message.name} </h4>
//         <p>  ${message.message} </p>`)
//     }

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

document.getElementById('readCeramic')?.addEventListener('click', () => {
  if (document.getElementById('stream') === null) {
    updateAlert('danger', `Error, please write to ceramic first so a stream can be read`)
  } else {
    //console.log(window)
    selectedWalletAddress = window.ethereum.selectedAddress
    console.log('$$$kl - Selected Address:', selectedWalletAddress);

    //GET request to get messages for RX user
    fetch(' http://localhost:12345/users', {
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
        //console.log('this is the streamID youre sending: ', streamToDecrypt)
        document.getElementById('decryption').innerText = "From: (" + data[i].fromName + ") " + data[i].fromAddr.toLowerCase() + ":\n"
        const response = litCeramicIntegration.readAndDecrypt(streamToDecrypt).then(
          (value) => (addMessageReceiver(value + "\n", data[i].fromName))
        )

        //mark as read if box is checked
        if(document.getElementById('readReceipts').checked) {
          const putData = { streamID: `${data[i].streamID}`, fromName: `${data[i].fromName}`, fromAddr: `${data[i].fromAddr}`, toAddr: `${data[i].toAddr}`, read: true }
          fetchPut(putData, data[i].id)
        }
      }
      //print sent messages
      if(data[i].fromAddr.toLowerCase() == selectedWalletAddress.toLowerCase()) {
        const response = litCeramicIntegration.readAndDecrypt(streamToDecrypt).then(
          (value) => (addMessageSender(value + "\n", data[i].fromName, data[i].read))
        )
      }
    }

    })
    //Then with the error genereted...
    .catch((error) => {
      console.error('GET to REST API error!!!!!!!!!!!!:', error);
    });
  }
})

// encrypt with Lit and write to ceramic

document.getElementById('encryptLit')?.addEventListener('click', function () {
  console.log('chain in litCeramicIntegration: ', litCeramicIntegration.chain)
  // @ts-ignore
  selectedWalletAddress = window.ethereum.selectedAddress
  console.log('$$$kl - Selected Address:', selectedWalletAddress);

  const stringToEncrypt = document.getElementById('secret').value;
  const sendToAddress = document.getElementById('sendaddr').value;
  console.log(`$$$kl - + ${sendToAddress}`)

  // User must posess at least 0.000001 ETH on eth
  // const accessControlConditions = [
  //   {
  //     contractAddress: '',
  //     standardContractType: '',
  //     chain: 'polygon',
  //     method: 'eth_getBalance',
  //     parameters: [':sendToAddress', 'latest'],
  //     returnValueTest: {
  //       comparator: '>=',
  //       value: '1000000000000',
  //     },
  //   },
  // ]
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

  
    //GET request to get messages for RX user
    fetch(' http://localhost:12345/users', {
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
        //console.log('this is the streamID youre sending: ', streamToDecrypt)
        document.getElementById('decryption').innerText = "From: (" + data[i].fromName + ") " + data[i].fromAddr.toLowerCase() + ":\n"
        const response = litCeramicIntegration.readAndDecrypt(streamToDecrypt).then(
          (value) => (addMessageReceiver(value + "\n", data[i].fromName))
        )

        //mark as read if box is checked
        if(document.getElementById('readReceipts').checked) {
          const putData = { streamID: `${data[i].streamID}`, fromName: `${data[i].fromName}`, fromAddr: `${data[i].fromAddr}`, toAddr: `${data[i].toAddr}`, read: true }
          fetchPut(putData, data[i].id)
        }
      }
      //print sent messages
      if(data[i].fromAddr.toLowerCase() == selectedWalletAddress.toLowerCase()) {
        const response = litCeramicIntegration.readAndDecrypt(streamToDecrypt).then(
          (value) => (addMessageSender(value + "\n", data[i].fromName, data[i].read))
        )
      }
    }

    })
    //Then with the error genereted...
    .catch((error) => {
      console.error('GET to REST API error!!!!!!!!!!!!:', error);
    });

  // const evmContractConditions = [
  //   {
  //     contractAddress: '0xb71a679cfff330591d556c4b9f21c7739ca9590c',
  //     functionName: 'members',
  //     functionParams: [':userAddress'],
  //     functionAbi: {
  //       constant: true,
  //       inputs: [
  //         {
  //           name: '',
  //           type: 'address',
  //         },
  //       ],
  //       name: 'members',
  //       outputs: [
  //         {
  //           name: 'delegateKey',
  //           type: 'address',
  //         },
  //         {
  //           name: 'shares',
  //           type: 'uint256',
  //         },
  //         {
  //           name: 'loot',
  //           type: 'uint256',
  //         },
  //         {
  //           name: 'exists',
  //           type: 'bool',
  //         },
  //         {
  //           name: 'highestIndexYesVote',
  //           type: 'uint256',
  //         },
  //         {
  //           name: 'jailed',
  //           type: 'uint256',
  //         },
  //       ],
  //       payable: false,
  //       stateMutability: 'view',
  //       type: 'function',
  //     },
  //     chain: 'xdai',
  //     returnValueTest: {
  //       key: 'shares',
  //       comparator: '>=',
  //       value: '1',
  //     },
  //   },
  // ]

  // const response = litCeramicIntegration
  //   .encryptAndWrite(stringToEncrypt, evmContractConditions, 'evmContractConditions')
  //   .then((value) => updateStreamID(value))
  // console.log(response)
})
