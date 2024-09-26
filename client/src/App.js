import axios from 'axios';
import { useState } from 'react';

function App() {
  const [orderDetails, setOrderDetails] = useState(null);
  const tShirts = [
    { id: 1, name: 'Premium', price: 100 },
  ];

  const handlePayment = async (tShirt) => {
    const data = {
      name: tShirt.name,
      amount: tShirt.price,
      number: '9639095114',
      MID: 'MID' + Date.now(),
      transactionId: 'T' + Date.now()
    };

    try {
      await axios.post('http://localhost:8000/order', data).then(res => {
        console.log(res.data);
        if (res.data.success === true) {
          window.location.href = res.data.data.instrumentResponse.redirectInfo.url;
        }
      }).catch(err => {
        console.log(err);
      });
    } catch (error) {
      console.log(error);
    }
  };

  const fetchStatus = async (transactionId) => {
    try {
      const res = await axios.post(`http://localhost:8000/status?id=${transactionId}`);
      if (res.data.success) {
        setOrderDetails(res.data.order);
      } else {
        console.log("Payment failed");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      {tShirts.map(tShirt => (
        <div>
          <button className='btn' onClick={() => handlePayment(tShirt)}>Buy Premium</button>
        </div>
      ))}
    </div>
  );
}

export default App;
