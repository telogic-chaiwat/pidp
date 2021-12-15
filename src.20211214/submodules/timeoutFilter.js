module.exports.timeoutFilter = function(data) {
  const currentTime = new Date().getTime();
  const threshold = 300 * 1000;
  if (Array.isArray(data)) {
    const resultFilter = data.filter((value)=>{
      try {
        const timeoutValue = (value.request_timeout?value.request_timeout:
                                0) *1000;
        const timeOutTime = value.creation_time + timeoutValue - threshold;
        if (currentTime <= timeOutTime) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        this.debug('error while filter timeout error meesage : ' + err.message);
        return false;
      }
    });
    return resultFilter;
  }
  return data;
};
