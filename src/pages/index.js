import { useEffect, useState } from 'react'
import Script from 'next/script'
import StripeContainer from '@/components/StripeContainer'
import axios from 'axios'
import * as qs from 'qs'

export default function Home() {
  const [ticketType, setTicketType] = useState(null)
  const [eventDetails, setEventDetails] = useState(null)
  const [selectedItems, setSelectedItems] = useState([]) //Our fake cart
  const [shoppingCart, setShoppingCart] = useState([])
  const [reservationToken, setReservationToken] = useState(undefined)
  const [checkoutIdAndSecret, setCheckoutIdAndSecret] = useState(null)
  const [email, setEmail] = useState(null)
  const [paymentFormId, setPaymentFormId] = useState(null)
  const [payFormDetails, setPayFormDetails] = useState(null)
  const[paymentSuccess, setPaymentSuccess] =  useState(false)
  // const eventId = '642ccf05f3622e50a284b00e' // Single Event Test 2
  // const eventId = '643558941fe2aebaae76dd81' // Single Event Test 
  const eventId = '643f6cecc109316e1b058e70' // ANZAC event test with seat maps
  const vivenuEventId = 'anzac-kpbde6' // ANZAC event test with seat maps 
  
  const coreUrl = "https://vivenu.dev"
  const baseUrl = "https://seatmap.vivenu.dev";
  const vcxStagingUrl = "https://vcxdataplatformqa-eval-prod.apigee.net"
  const client_id = 'HdutMo9TAVrSPOx5Wc2Ds5ZALceWkYRo'
  const client_secret = 'ZUAykBuhL1ngYZW2'
  const vivenuApiKey = 'key_eb4188bd1b920bae03ea8deab794e2d99293be9d715ff2bfef08ca2b8be489041d40ccb367db52139a89575c4c94163e'

  let seatingEvent;
  let childEventIds;

  
  const handleScriptLoad = () => {
    loadEvent()
  }
  // Load event informations
  const loadEvent = async () => {
    const response = await fetch(coreUrl + `/api/events/info/${eventId}`, {
        method: "GET",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });
    const result = await response.json();
    // eventDetails = result;
    if (result) {
      setEventDetails(result)
    }
    onEventInfo(result);
  }
  const onEventInfo = (eventInfo) => {
    const seatingEventId = eventInfo.seatingEventId;
    childEventIds = [seatingEventId];
    let rtoken = undefined;
    let instance = VIInit();
    instance.initSeatSelector({
        eventId: seatingEventId,
        childEventIds: childEventIds,
        holder: "map",
        baseUrl: baseUrl,
        callbacks: {
            onObjectSelected: async function(type, id, resource) {
                console.log(type, id, resource);
                const seatingCategory = eventInfo.categories.filter(category => category.seatingReference === resource.categoryId)[0]
                const seatTickets = eventInfo.tickets.filter(ticket => ticket.categoryRef === seatingCategory.ref)
                
                console.log('seatTickets', seatTickets, reservationToken)
                const res = await SeatingService.reserveObject(seatingEventId, resource.statusId, rtoken, childEventIds);
                if (!rtoken) {
                    setReservationToken(res.token)
                    rtoken = res.token;
                    // reservationToken = res.token;
                }
                setSelectedItems([...selectedItems, resource])
                // selectedItems.push(resource);
                setTicketType({rowName: resource.rowName, seatName: resource.seatName, categoryName: seatingCategory.name, tickets: seatTickets, resource})
                console.log('selected Items', selectedItems)
            },
            onObjectDeselected: async function(type, id, resource) {
                console.log(type, id, resource);
                const selectedObjects = selectedItems.filter(item => item._id !== id)
                setSelectedItems(selectedObjects)
                const res = await SeatingService.freeObject(seatingEventId, resource.statusId, reservationToken);
            },
            onSelectionInvalid: function(type, validity) {
                console.log(type, validity);
            },
            onSelectionValid: function(type) {
                console.log(type);
            },
            onLoadDone: function() {
                console.log("loaded");
            },
        },
        options: {
            categories: eventInfo.categories,
            ticketTypes: eventInfo.tickets,
            selectedObjects: [],
            contingents: null,
            orphan: {
                minSeatDistance: 2,
                edgeSeatsOrphaning: true,
            },
            spaceManagement: {
                enabled: false,
                blockSeatNumberAround: 1,
            },
            theme: "light", // "light",
            allowSelectionOfUnavailableObjects: false,
        },
    });
  }
  
  const  getAccessToken =  async () => {
    const endpoint = vcxStagingUrl + '/oauth/accesstoken?grant_type=client_credentials'
    const requestBody = qs.stringify({
      client_id,
      client_secret,
      grant_type: 'client_credentials',
      scope: 'client_credentials'
    })

    const response = await axios.post(endpoint, requestBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    const accessTokenRes = response.data

    console.log('accessTokenRes', accessTokenRes)
    return accessTokenRes.access_token
  }
  const vcxPaymentIntent = async (checkoutId, secret, token) => {
    const response = await fetch(vcxStagingUrl + "/payment/v1/payment-intent/vivenu/0?checkout_id="+checkoutId+"&secret="+secret, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }
    });
    const paymentIntentRes =  await response.json();
    console.log('paymentIntentRes', paymentIntentRes);
    if (paymentIntentRes) {
      setPaymentFormId(paymentIntentRes)
    }
    
  }
  // const vivenuPurchaseIntent = async (tickets) => {
  //   const response = await fetch(coreUrl + "/api/purchaseintents", {
  //     method: "POST",
  //     body: JSON.stringify({
  //       eventId,
  //       tickets
  //     }),
  //     headers: {
  //       "Content-Type": "application/json",
  //       "Authorization": "Bearer " + vivenuApiKey
  //     }
  //   });
  //   const purchaseIntentRes =  await response.json();
  //   console.log('purchaseIntentRes', purchaseIntentRes)
  //   return purchaseIntentRes._id
  // }
  const createCheckout = async () => {
    const response = await fetch(coreUrl + "/api/checkout", {
        method: "POST",
        body: JSON.stringify({
            eventId: eventId,
            type: "transaction",
            items: shoppingCart.map(cartItem => {
              return {
                amount: 1,
                ticketTypeId: cartItem.ticketId,
                seatingInfo: cartItem.seatingObjectInfo
              }
            }),
            seatingReservationToken: reservationToken
        }),
        headers: {
            "Content-Type": "application/json",
        }
    });
    const checkoutRes =  await response.json();
    if (checkoutRes) {
      setCheckoutIdAndSecret(checkoutRes)
    }
    // const tickets = checkoutRes.items[0].tickets
    // return json.transaction;
    // vivenu purchase intent
    // const purchaseIntentId = await vivenuPurchaseIntent(tickets)
    // // get access token
    // const token = await getAccessToken()
    // // vcx payment intent
    // const checkoutId = checkoutRes._id
    // const secret = checkoutRes.secret
    // await vcxPaymentIntent(checkoutId, secret, token)
  };
  
  const SeatingService = {
    reserveObject: async function(eventId, objectId, token, childEventIds, amount = 1) {
        const url = baseUrl + `/api/public/event/${eventId}/reserve`;
        let payload = {
            objectId: objectId,
        };

        if (childEventIds) {
            payload.childEventIds = childEventIds;
        }
        if (token) {
            payload.token = token;
        }
        if (amount) {
            payload.amount = amount;
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        return await response.json();
    },
    freeObject: async function(eventId, objectId, token, amount = 1) {
        const url = baseUrl + `/api/public/event/${eventId}/free`;
        const payload = {
            objectId: objectId,
            token: token,
            amount: amount,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        return await response.json();
    }
  };
  const addCustomerDetails = async () => {
    const url = coreUrl + `/api/checkout/${checkoutIdAndSecret._id}/details`;
        const payload = {
          secret: checkoutIdAndSecret.secret,
          company: "Vicinity",
          prename: "Hari",
          lastname: "Suddapalli",
          email,
          emailRepeat: email,
          street: "81 james cook drive",
          postal: "3029",
          city: "Truganina",
          country: "AU",
          extraFields: {}
      }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const checkoutCustomerDetails = await response.json();
        console.log('checkoutCustomerDetails', checkoutCustomerDetails)
        // paymentRequest()
        // get access token
        const token = await getAccessToken()
        // vcx payment intent
        const checkoutId = checkoutCustomerDetails._id
        const secret = checkoutCustomerDetails.secret
        await vcxPaymentIntent(checkoutId, secret, token)

  }
  const finalPaymentSubmission = async () => {
    console.log('payFormDetails', payFormDetails)
    const {card, stripe} = payFormDetails
    const stripeSecret = paymentFormId.message.client_secret
    const result = await stripe.confirmCardPayment(stripeSecret, {
      payment_method: {
        card,
        billing_details: {
          email,
          name: 'Hari suddapalli',
          phone: '0432023177',
          address: {
            postal_code: '3029'
          }
        }
      }
    })
    if (result.paymentIntent.status === 'succeeded') {
      setPaymentSuccess(true)
      console.log('setPaymentSuccess')
    }
    console.log('result', result)
  }
  const newTickets = () => {
    setShoppingCart([])
    setSelectedItems([])
    setReservationToken(undefined)
    setCheckoutIdAndSecret(null)
    setEmail(null)
    setPaymentFormId(null)
    setPayFormDetails(null)
    setPaymentSuccess(false)
  }
  // back end apis start
  const paymentRequest = async () => {
    const url = coreUrl + '/api/payments/requests'
    const payload = {
      secret: checkoutIdAndSecret.secret,
      checkoutId: checkoutIdAndSecret._id
  }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const paymentRequestResp = await response.json();
    console.log(paymentRequestResp)
    const paymentGatewayOptions = await fetch(coreUrl + '/api/checkout/'+checkoutIdAndSecret._id+'/payment-methods?secret='+checkoutIdAndSecret.secret, {
      method: "GET",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }
    });
    const paymentGatewayOptionsResp = await paymentGatewayOptions.json();
    console.log('paymentGatewayOptions', paymentGatewayOptionsResp)
    const paymentRequestProcessor = await fetch(coreUrl + '/api/payments/requests/'+paymentRequestResp._id+'/processor', {
      method: "POST",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({paymentGatewayId: "638442348929ddd7a0c9f688"}),
    });
    const paymentRequestProcessorResp = await paymentRequestProcessor.json();
    if (paymentRequestProcessorResp) {
      setPaymentFormId(paymentRequestResp._id)
    }
    console.log('paymentRequestProcessor', paymentRequestProcessorResp)
  }
// back end api finished

  const iframeDisplay = () => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://vivenu.dev/checkout/${eventId}?embedded=true&boxOnly=true`
    iframe.id = "shopIframe"
    iframe.className = "iframe"
    iframe.allow = "payment *"
    document.body.appendChild(iframe);
	}
  const closeIframe = () => {
    const myFrame = document.getElementById('shopIframe');
		if (myFrame) {
			document.body.removeChild(myFrame)
		}
  }
  let shoppingCartTotal = 0
  shoppingCart.forEach(item => {shoppingCartTotal = shoppingCartTotal + item.ticketPrice})
  
  return (
    <>
      <div style={{textAlign: 'center', fontSize: '20px'}}>Seating Map POC using NextJs</div>
      <br />
      
      <div style={{textAlign: 'center'}}>
        <a href={`https://vivenu.dev/event/${vivenuEventId}?useEmbed=true`}>Out of box solution Modal - Buy Tickets</a>
      </div>
      <br />
      <div style={{textAlign: 'center'}}>
        <a target='_blank' href={`https://vivenu.dev/event/${eventDetails && eventDetails.url}`}>Out of box solution by using External link - Buy Tickets</a>
      </div>
      <br />
      <div style={{textAlign: 'center'}}>
        <a href="" style={{marginRight: '100px'}} onClick={iframeDisplay}>Out of box solution by using Iframe - Buy Tickets</a>
        <a href="" onClick={closeIframe}>X - Close Iframe</a>
      </div>
      <br />
      {ticketType && <div className='ticket-type'>
        <div className='ticket-select'>
          <div style={{background: 'white'}}>
              <div className='ticket-type-picker-header'>
                <h5>Select a ticket type</h5>
              </div>
              <br />
              <div>
              <div className="ticket-type-picker-inner">
              <span className="cat-name">{ticketType.categoryName}</span>
              <div className="seating-info">
                {ticketType.rowName && <div>
                  <div className="text small muted">Row</div>
                  <div className="text small">{ticketType.rowName}</div>
                </div>}
                {ticketType.seatName && <div>
                  <div className="text small muted">Seat</div>
                  <div className="text small">{ticketType.seatName}</div>
                </div>}
              </div>
              <br />
              <div className="ticket-type-option-holder">
              {ticketType.tickets.map((ticket, index) => (
                    <div className="ticket-type-option" key={ticket.name + 'type' + index} onClick={() => {setTicketType(null); setShoppingCart([...shoppingCart, {rowName: ticketType.rowName, seatName: ticketType.seatName, ticketType: ticket.name, ticketPrice: ticket.price, ticketId: ticket.id, seatingObjectInfo: ticketType.resource}])}}>
                      <span className="name">{ticket.name}</span>
                      <span className="price">A${ticket.price}.00</span>
                    </div>
                  ))
                }
              </div>
              <br />
              <button className="btn" onClick={() => SeatingService.freeObject()}>Cancel</button></div>
                
              </div>
            </div>
            </div>
        </div>}
      <div style={{display: 'flex'}}>
        <div id="map"> {eventDetails && <div style={{fontSize: '20px'}}>Name of the Event: {eventDetails.name} - Seat selection</div>}</div>
        <div id='cart'>
          <div style={{fontSize: '20px'}}>
            {eventDetails && <p>Shopping cart: {eventDetails.name}</p>}
            <hr />
            {shoppingCart.length > 0 ?
            <div style={{marginTop: '20px'}}>
              {shoppingCart.map((item, index) => {
                return(<div key={item.name + 'cart' + index}>
                  <div className="ticket-type-option" key={item.name} >
                      <span className="name">{item.ticketType}</span>
                      <span className="price">A${item.ticketPrice}.00</span>
                    </div>
                    <div style={{display: 'flex', marginBottom: '15px'}}>
                {item.rowName && <div style={{marginRight: '20px'}}>
                  <div className="text small muted">Row</div>
                  <div className="text small">{item.rowName}</div>
                </div>}
                {item.seatName && <div>
                  <div className="text small muted">Seat</div>
                  <div className="text small">{item.seatName}</div>
                </div>}
              </div>
                  </div>)
              })}
              <br/>
              <div className="ticket-type-option" >
                      <span className="name">Total</span>
                      <span className="price">A${shoppingCartTotal}.00</span>
                    </div>
                <br/><br/>
              {paymentSuccess ? <div>
                <h3>Well done, Payments success</h3>
                <br/>
                <button className='btn' onClick={newTickets}>Book Again</button>
                </div>
              :checkoutIdAndSecret
                ?
                paymentFormId ? <StripeContainer paySecrets={paymentFormId} onComplete={(content) => setPayFormDetails(content)} paymentSubmit={finalPaymentSubmission}/>
                :<div>
                  <input className="email" placeholder="Email" type="text" onChange={(e) => setEmail(e.target.value)}/>
                  <br />
                  <button className='btn' onClick={addCustomerDetails}>Proceed to payment</button>
                </div>
                :<button className='btn' onClick={createCheckout}>Create Checkout</button> }
            </div>
            :<p>The shopping cart is empty. Please select tickets.</p>}
            
          </div>
        </div>
      </div>
      <Script
        beforeInteractive
        type="application/javascript"
        src={baseUrl + "/js/init.js?r=" + Math.random()}
        onLoad={handleScriptLoad}
      />
      
    </>
  )
}
