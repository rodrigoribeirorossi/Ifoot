// Usando fetch nativo do Node.js moderno (versão 18+)

async function clearTestData() {
  try {
    process.env.NODE_ENV = 'development'; // Garantir que o ambiente está como desenvolvimento
    
    const response = await fetch('http://localhost:3001/api/dev/clear-test-data', {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Dados de teste removidos com sucesso');
    } else {
      console.error('❌ Falha ao remover dados:', data.error);
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com o servidor:', error.message);
    console.error('Verifique se o servidor está rodando em http://localhost:3001');
  }
}

// Executar a função
clearTestData();