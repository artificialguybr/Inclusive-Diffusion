addEventListener('fetch', event => {
  const request = event.request;
  if (request.method === "OPTIONS") {
    // Handle preflight request
    event.respondWith(handlePreflight(request));
  } else {
    // Handle POST, GET, etc.
    event.respondWith(handleRequest(request));
  }
});

function handlePreflight(request) {
  // Certifique-se de adicionar outros cabeçalhos necessários para sua aplicação
  let headers = new Headers({
    "Access-Control-Allow-Origin": "*", // Ajuste conforme necessário
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });

  return new Response(null, {
    status: 204,
    headers: headers
  });
}

async function handleRequest(request) {
  const requestBody = await request.json();
  const apiEndpoint = 'FAL.AI.API.ENDPOINT'; 
  const authorizationKey = 'FAL.AI.AUTHORIZATIONKEY';

  const modifiedRequest = new Request(apiEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${authorizationKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const response = await fetch(modifiedRequest);
  
  // Adicionar cabeçalhos CORS
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*'); // Ajuste conforme necessário

  // Criar nova resposta com cabeçalhos CORS
  const corsResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });

  return corsResponse;
}
