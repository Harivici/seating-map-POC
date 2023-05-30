import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import React from "react"
// import PaymentForm from "./PaymentForm"
import { VCXPaymentForm } from "./VCXPaymetForm"
// const PUBLIC_KEY =  
// "pk_test_51HIZwuInNLJy2EWLWAKHHx3XIrIMwRjq0YxyFI6FTptz09lfNJayevroKSdoLK5VINum9whMLHvH2pxhNnXYoz8u00nMSoFWSO";

// const stripeTestPromise = loadStripe(PUBLIC_KEY)

export default function StripeContainer({paySecrets, onComplete, paymentSubmit}) {
	console.log('paySecrets', paySecrets)
	const stripeTestPromise = loadStripe(paySecrets.message.public_key)
	return (
		<Elements stripe={stripeTestPromise}>
			<VCXPaymentForm onComplete={onComplete}/>
			<br />
			<button className='btn' onClick={paymentSubmit}>Payment Submit</button>
			{/* <PaymentForm paymentId={id}/> */}
		</Elements>
	)
}
