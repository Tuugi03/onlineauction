const asyncHandler = require("express-async-handler");
const Request = require("../models/request");
const axios = require('axios');
const crypto = require('crypto');


const getQPayToken = async () => {
  try {
    const authString = Buffer.from(
      `${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`
    ).toString('base64');

    const response = await axios.post(
      `${process.env.QPAY_BASE_URL}/v2/auth/token`,
      {},
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 
      }
    );

    const accessToken = response.data.access_token;
    
    if (!accessToken) {
      throw new Error('No access token received from QPay');
    }

    return accessToken;
    
  } catch (error) {
    console.error('Full QPay error:', {
      message: error.message,
      code: error.code,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      },
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    throw new Error(`QPay token failed: ${error.response?.data?.message || error.message}`);
  }
};
const createQPayInvoice = async (requestData, user) => {
  const token = await getQPayToken()

  const invoiceData = {
    invoice_code: "TEST1_INVOICE", 
    sender_invoice_no: `REQ_${Date.now()}`,
    sender_branch_code: "branch", 

    invoice_receiver_code: "terminal",
    invoice_receiver_data: {
      register: "АЮ95121225",
      name: "ОЮУНДАРЬ",
      email: "oyundari.b@qpay.mn",
      phone: "80906039"
    },
    invoice_description: "Duudlaga hudaldaa",
    amount: requestData.amount, 
    lines: [
      {
        tax_product_code: null,
        line_description: "Invoice description",
        line_quantity: "1.00",
        line_unit_price: "250.00",
        note: ""
      },
      {
        tax_product_code: null,
        line_description: "Invoice description",
        line_quantity: "1.00", 
        line_unit_price: "350.00",
        note: ""
      }
    ],
    transactions: [
      {
        description: "Payment part 1",
        amount: "250.00",
        accounts: [
          {
            account_bank_code: "390000",
            account_number: "8010191022",
            account_name: "Sereeter",
            account_currency: "MNT",
            is_default: true 
          }
        ]
      },
      {
        description: "Payment part 2",
        amount: "350.00",
        accounts: [
          {
            account_bank_code: "050000",
            account_number: "5041323449",
            account_name: "ganzul",
            account_currency: "MNT",
            is_default: false 
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(
      `${process.env.QPAY_BASE_URL}/v2/invoice`,
      invoiceData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return response.data;
   
  } catch (error) {
    console.error('QPay Error Details:', {
      requestData: invoiceData,
      error: error.response?.data || error.message
    });
    throw new Error('Payment failed: ' + (error.response?.data?.message || 'Check transaction data'));
  }
};
const getRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find()
    .populate('user', 'name email') 
    .sort({ createdAt: -1 });

  res.status(200).json(requests);
});

const addRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || amount < 5000) {
    res.status(400);
    throw new Error('Amount must be at least 5000');
  }

  const newRequest = await Request.create({
    user: userId,
    amount,
    status: 'pending'
  });

  try {
    const invoice = await createQPayInvoice(newRequest, req.user);
    
    newRequest.payment = {
      invoiceId: invoice.invoice_id,
      qrText: invoice.qr_text,
      qrImage: invoice.qr_image,
      urls: invoice.urls,
      status: 'pending'
    };
    
    await newRequest.save();
    
    res.status(201).json({
      request: newRequest,
      payment: invoice
    });
  } catch (error) {
    await Request.findByIdAndDelete(newRequest._id);
    res.status(500);
    throw new Error(error.message);
  }
});


const deleteRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;

  const deletedRequest = await Request.findByIdAndDelete(requestId)
    .populate('user', 'name email');

  if (!deletedRequest) {
    res.status(404);
    throw new Error("Request not found");
  }

  res.status(200).json({ 
    message: "Request deleted successfully", 
    deletedRequest 
  });
});

module.exports = { 
  getRequests,
  addRequest,
  deleteRequest,
};