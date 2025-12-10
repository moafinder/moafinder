const parseGermanCoord = (str) => {
  if (!str) return NaN
  const cleaned = str.replace(/\./g, '')
  if (cleaned.length < 3) return NaN
  const withDecimal = cleaned.slice(0, 2) + '.' + cleaned.slice(2)
  return parseFloat(withDecimal)
}

const samples = [
  '5.253.269.674.008.180',
  '13.338.965.568.331.800',
  '5.253.227.955.082.940',
  '13.323.684.532.383.300',
  '52.532.481.329.730.300',
  '13.352.219.124.531.400'
]

samples.forEach(s => {
  console.log(s, '->', parseGermanCoord(s))
})
