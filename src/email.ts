import { Schema, model } from 'mongoose';

const ObjectId = Schema.ObjectId;

const Email = new Schema({
  to: String,
  subject: String,
  date: Date,
  message: String,
  type: String
});

export default model('Email', Email);