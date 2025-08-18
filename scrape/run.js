const { data } = require('./jiot')

console.log('T6HZ')
data.map((v)=>{
    console.log( v.seller_wise_mrp.T6HZ[1].mrp,v.seller_wise_mrp.T6HZ[1].price)
})
