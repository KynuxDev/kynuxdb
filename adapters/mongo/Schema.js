const { Schema, model } = require('mongoose');

const KynuxDefaultSchema = new Schema({
  key: {
    type: Schema.Types.String,
    required: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

module.exports = (name) => {
  return typeof name === 'string'
    ? model(name, KynuxDefaultSchema)
    : model('KynuxDB', KynuxDefaultSchema);
};
