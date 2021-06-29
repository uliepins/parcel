const express = require('express');
const Joi = require('joi');
const app = express();
app.use(express.json());


function validateTruck(new_truck) {
  const schema = Joi.object({
    name: Joi.string().min(3).required()
  });
  return schema.validate(new_truck);
}

function validateParcel(new_parcel){
  const schema = Joi.object({
    item: Joi.string().min(3).required(),
    weight: Joi.number().positive().required()
  });
  return schema.validate(new_parcel);
}

class Truck {
  constructor(id, name){
    this.id = id;
    this.name = name;
    this.load = [];
  }
  display_load(){
    return this.load;
  }
  num_parcels(){
    return this.load.length;
  }
  load_parcel(new_parcel){
    this.load.push(new_parcel);
  }
  unload_parcel(existing_parcel){
    const parcel_found = this.load.find(p => p.item() === existing_parcel);
    if (!parcel_found) return false;
    const index = this.load.indexOf(parcel_found);
    this.load.splice(index, 1);
    return true;
  } 
  total_weight(){
    let weight = 0
    for (let p of this.load){
      weight += p.weight();
    }
    return weight;
  }
}

class Parcel {
  constructor(item, weight){
    this._item = item;
    this._weight = weight;
  }
  weight(){
    return this._weight;
  };
  item(){
    return this._item;
  };
}

const port = process.env.PORT || 3000;
const trucklist = [];

//return the list of existing trucks
app.get('/api/truckservice', (req, res) => {
  res.send(trucklist);
});

//create a new empty truck
app.post('/api/truckservice/newtruck', (req, res) => {
  const {error} = validateTruck(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const truck = new Truck(trucklist.length+1, req.body.name);
  trucklist.push(truck);
  res.send(truck);
});

//load a new parcel into a given truck
app.put('/api/truckservice/load/:id', (req, res) => {
  // console.log(req.params.id);
  const truck = trucklist.find(c => c.id === parseInt(req.params.id));
  if (!truck) return res.status(404).send('The given truck was not found.');
  const parcel_result = validateParcel(req.body);
  if (parcel_result.error) return res.status(400).send(parcel_result.error.details[0].message);
  const parcel = new Parcel(req.body.item, parseInt(req.body.weight));
  truck.load_parcel(parcel);
  res.send(truck);
});

//unload a given parcel from a given truckload 
app.put('/api/truckservice/unload/:id', (req, res) => {
  // console.log(req.params);
  const truck = trucklist.find(c => c.id === parseInt(req.params.id));
  if (!truck) return res.status(404).send('The given truck was not found.');
  const result = truck.unload_parcel(req.body.item);
  if (result) {
    res.send(truck);
  } else {
    res.send('Unable to find parcel in given truck\'s load.');
  }
});

//return a given truck object and its attributes
app.get('/api/truckservice/truck/:id', (req,res) => {
  // console.log(req.params);
  const truck = trucklist.find(c => c.id === parseInt(req.params.id));
  if (!truck) return res.status(404).send('The given truck was not found.');
  res.send(truck);
});

//return the weight of a given truck
app.get('/api/truckservice/weight/:id', (req,res) => {
  // console.log(req.params);
  const truck = trucklist.find(c => c.id === parseInt(req.params.id));
  if (!truck) return res.status(404).send('The given truck was not found.');
  const load_size = 'Truck ' + truck.id + ' has ' + truck.load.length.toString() + ' items in its shipment. '
  const weight_result = 'The weight of truck ' + truck.id + ' is ' + truck.total_weight().toString() + '. ';
  res.send(load_size + weight_result);
});

//remove a given truck object from the list
app.delete('/api/truckservice/remove/:id', (req, res) => {
  // console.log(req.params);
  const truck = trucklist.find(c => c.id === parseInt(req.params.id));
  if (!truck) return res.status(404).send('The given truck was not found.');
  const index = trucklist.indexOf(truck);
  trucklist.splice(index, 1);
  res.send(truck);
});

app.listen(port, () => console.log('listening on port ' + port.toString()));
