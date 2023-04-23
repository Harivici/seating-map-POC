import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import PaymentForm from "./PaymentForm"

const PUBLIC_KEY =  
"pk_test_51HIZwuInNLJy2EWLWAKHHx3XIrIMwRjq0YxyFI6FTptz09lfNJayevroKSdoLK5VINum9whMLHvH2pxhNnXYoz8u00nMSoFWSO";

const stripeTestPromise = loadStripe(PUBLIC_KEY)

export default function StripeContainer({id}) {
	return (
		<Elements stripe={stripeTestPromise}>
			<PaymentForm paymentId={id}/>
		</Elements>
	)
}
