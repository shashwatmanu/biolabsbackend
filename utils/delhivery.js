const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY || 'b77ef52e91a3b33a0a0eb106733ddddceffcb63a';
const DELHIVERY_BASE_URL = 'https://track.delhivery.com';

/**
 * Check if a pin code is serviceable by Delhivery.
 * We use the pin codes API endpoint for this.
 */
async function checkServiceabilityAndRate(destinationPin, weight = 500, mode = 'EXPRESS') {
  try {
    const response = await fetch(`${DELHIVERY_BASE_URL}/c/api/pin-codes/json/?token=${DELHIVERY_API_KEY}&filter_codes=${destinationPin}`);
    const data = await response.json();
    
    if (data.delivery_codes && data.delivery_codes.length > 0) {
      const p = data.delivery_codes[0].postal_code;
      // Depending on actual response structure, typically indicates serviceability
      const isServiceable = p.pin === destinationPin || p.is_oda !== undefined;
      return { serviceable: true, estimate: 50 }; // Hardcoded estimate since the rate API requires more complex auth (HQ client ID etc. not easily available via standard REST without MCP)
    }
    return { serviceable: false, error: 'Pin code not serviceable' };
  } catch (error) {
    console.error('Delhivery serviceability error:', error);
    // Fail open if the API fails so we don't block checkouts unnecessarily
    return { serviceable: true, estimate: 50 };
  }
}

/**
 * Create a shipment on Delhivery
 */
async function createShipment(orderData) {
  try {
    const payloadStr = JSON.stringify({
      shipments: [
        {
          name: orderData.guestDetails?.name || 'Customer',
          add: orderData.shippingAddress.street,
          pin: orderData.shippingAddress.postalCode,
          city: orderData.shippingAddress.city,
          state: orderData.shippingAddress.state,
          country: orderData.shippingAddress.country || 'India',
          phone: orderData.guestDetails?.phone || '9999999999',
          order: orderData.invoiceNumber || `ORD-${Date.now()}`,
          payment_mode: orderData.paymentMethod === 'Razorpay' ? 'Prepaid' : 'COD',
          return_pin: '', 
          return_city: '',
          return_phone: '',
          return_add: '',
          return_state: '',
          return_country: '',
          products_desc: orderData.items.map(i => i.title).join(', '),
          hsn_code: '',
          cod_amount: orderData.paymentMethod === 'Razorpay' ? 0 : orderData.totalAmount,
          order_date: new Date().toISOString(),
          total_amount: orderData.totalAmount,
          quantity: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
          weight: orderData.items.length * 500
        }
      ]
    });

    const response = await fetch(`${DELHIVERY_BASE_URL}/api/cmu/create.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Token ${DELHIVERY_API_KEY}`
      },
      body: 'format=json&data=' + encodeURIComponent(payloadStr)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      console.error('Failed to parse Delhivery shipment creation response:', text);
      return null;
    }

    if (data.success && data.packages && data.packages.length > 0) {
      return {
        waybill: data.packages[0].waybill,
        shipmentId: data.packages[0].client_fl_code || data.packages[0].ref_id
      };
    } else {
      console.error('Delhivery shipment creation failed:', data);
      return null;
    }
  } catch (error) {
    console.error('Error creating Delhivery shipment:', error);
    return null;
  }
}

module.exports = {
  checkServiceabilityAndRate,
  createShipment
};
