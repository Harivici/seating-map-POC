import React, { useRef } from 'react'
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

export const VCXPaymentForm = ({ onComplete }) => {
  
  const paymentFormComplete = useRef([false, false, false])
  const stripe = useStripe()
  const elements = useElements()

  const updateField = (index, fieldComplete) => {
    paymentFormComplete.current[index] = fieldComplete
    const complete = paymentFormComplete.current.every(Boolean)
    if (!complete) {
      return
    }
    onComplete({
      complete,
      stripe: complete ? stripe : null,
      card: complete && elements ? elements.getElement(CardNumberElement) : null
    })
  }

  return (
    <div className={'styles.section'}>
      <h4>
        Payment Details
      </h4>
        <br />
        <div>
          <div className={'formStyles.inputSelect'}>
            <CardNumberElement
              // options={{ style }}
              onChange={(e) => {
                updateField(0, e.complete)
              }}
            />
          </div>
     
        
          <div className={'formStyles.inputSelect'}>
            <CardExpiryElement
              // options={{ style }}
              onChange={(e) => {
                updateField(1, e.complete)
              }}
            />
          </div>
        
        
          <div className={'formStyles.inputSelect'}>
            <CardCvcElement
              // options={{ style }}
              onChange={(e) => {
                updateField(2, e.complete)
              }}
            />
          </div>
        
          </div>
    </div>
  )
}
