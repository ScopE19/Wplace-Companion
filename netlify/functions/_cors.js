exports.withCors = (handler) => async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: corsHeaders(), body: '' };
    }
    const resp = await handler(event, context);
    return { ...resp, headers: { ...(resp.headers || {}), ...corsHeaders() } };
  };
  function corsHeaders() {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
  }