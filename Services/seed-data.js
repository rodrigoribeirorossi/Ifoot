const mysql = require('mysql2/promise');

// Times do Brasileirão Série A
const brasileiraoTeams = [
  { id: 101, name: 'Palmeiras', location: 'São Paulo', strength: 85, logo_url: '/assets/logos/palmeiras.png' },
  { id: 102, name: 'Flamengo', location: 'Rio de Janeiro', strength: 84, logo_url: '/assets/logos/flamengo.png' },
  { id: 103, name: 'Botafogo', location: 'Rio de Janeiro', strength: 82, logo_url: '/assets/logos/botafogo.png' },
  { id: 104, name: 'São Paulo', location: 'São Paulo', strength: 81, logo_url: '/assets/logos/sao-paulo.png' },
  { id: 105, name: 'Atlético Mineiro', location: 'Minas Gerais', strength: 80, logo_url: '/assets/logos/atletico-mg.png' },
  { id: 106, name: 'Fluminense', location: 'Rio de Janeiro', strength: 79, logo_url: '/assets/logos/fluminense.png' },
  { id: 107, name: 'Grêmio', location: 'Rio Grande do Sul', strength: 79, logo_url: '/assets/logos/gremio.png' },
  { id: 108, name: 'Athletico Paranaense', location: 'Paraná', strength: 78, logo_url: '/assets/logos/athletico-pr.png' },
  { id: 109, name: 'Internacional', location: 'Rio Grande do Sul', strength: 78, logo_url: '/assets/logos/internacional.png' },
  { id: 110, name: 'Corinthians', location: 'São Paulo', strength: 77, logo_url: '/assets/logos/corinthians.png' },
  { id: 111, name: 'Cruzeiro', location: 'Minas Gerais', strength: 76, logo_url: '/assets/logos/cruzeiro.png' },
  { id: 112, name: 'Vasco da Gama', location: 'Rio de Janeiro', strength: 75, logo_url: '/assets/logos/vasco.png' },
  { id: 113, name: 'Bahia', location: 'Bahia', strength: 74, logo_url: '/assets/logos/bahia.png' },
  { id: 114, name: 'Fortaleza', location: 'Ceará', strength: 74, logo_url: '/assets/logos/fortaleza.png' },
  { id: 115, name: 'Red Bull Bragantino', location: 'São Paulo', strength: 73, logo_url: '/assets/logos/bragantino.png' },
  { id: 116, name: 'Fluminense', location: 'Rio de Janeiro', strength: 73, logo_url: '/assets/logos/fluminense.png' },
  { id: 117, name: 'Atlético Goianiense', location: 'Goiás', strength: 71, logo_url: '/assets/logos/atletico-go.png' },
  { id: 118, name: 'Juventude', location: 'Rio Grande do Sul', strength: 70, logo_url: '/assets/logos/juventude.png' },
  { id: 119, name: 'Vitória', location: 'Bahia', strength: 70, logo_url: '/assets/logos/vitoria.png' },
];

// Times do Paulistão
const paulistaoTeams = [
  { id: 201, name: 'Santos', location: 'São Paulo', strength: 76, logo_url: '/assets/logos/santos.png' },
  { id: 202, name: 'Ponte Preta', location: 'Campinas', strength: 70, logo_url: '/assets/logos/ponte-preta.png' },
  { id: 203, name: 'Guarani', location: 'Campinas', strength: 69, logo_url: '/assets/logos/guarani.png' },
  { id: 204, name: 'São Bernardo', location: 'São Paulo', strength: 68, logo_url: '/assets/logos/sao-bernardo.png' },
  { id: 205, name: 'Novorizontino', location: 'São Paulo', strength: 67, logo_url: '/assets/logos/novorizontino.png' },
  { id: 206, name: 'Mirassol', location: 'São Paulo', strength: 67, logo_url: '/assets/logos/mirassol.png' },
  { id: 207, name: 'Botafogo-SP', location: 'Ribeirão Preto', strength: 66, logo_url: '/assets/logos/botafogo-sp.png' },
  { id: 208, name: 'Ituano', location: 'Itu', strength: 66, logo_url: '/assets/logos/ituano.png' },
  { id: 209, name: 'Inter de Limeira', location: 'Limeira', strength: 65, logo_url: '/assets/logos/inter-limeira.png' },
  { id: 210, name: 'Santo André', location: 'Santo André', strength: 65, logo_url: '/assets/logos/santo-andre.png' },
  { id: 211, name: 'Red Bull Bragantino', location: 'Bragança Paulista', strength: 75, logo_url: '/assets/logos/bragantino.png' },
  { id: 212, name: 'São Paulo FC', location: 'São Paulo', strength: 80, logo_url: '/assets/logos/sao-paulo.png' },
  { id: 213, name: 'Portuguesa', location: 'São Paulo', strength: 61, logo_url: '/assets/logos/portuguesa.png' },
  { id: 214, name: 'Corinthians', location: 'São Paulo', strength: 78, logo_url: '/assets/logos/corinthians.png' },
  { id: 215, name: 'Palmeiras', location: 'São Paulo', strength: 82, logo_url: '/assets/logos/palmeiras.png' },
];

// Times da Libertadores (times sul-americanos)
const libertadoresTeams = [
  { id: 301, name: 'River Plate', location: 'Argentina', strength: 83, logo_url: '/assets/logos/river-plate.png' },
  { id: 302, name: 'Boca Juniors', location: 'Argentina', strength: 82, logo_url: '/assets/logos/boca-juniors.png' },
  { id: 303, name: 'Nacional', location: 'Uruguai', strength: 78, logo_url: '/assets/logos/nacional-uru.png' },
  { id: 304, name: 'Peñarol', location: 'Uruguai', strength: 77, logo_url: '/assets/logos/penarol.png' },
  { id: 305, name: 'Olimpia', location: 'Paraguai', strength: 76, logo_url: '/assets/logos/olimpia.png' },
  { id: 306, name: 'Cerro Porteño', location: 'Paraguai', strength: 75, logo_url: '/assets/logos/cerro-porteno.png' },
  { id: 307, name: 'Colo-Colo', location: 'Chile', strength: 76, logo_url: '/assets/logos/colo-colo.png' },
  { id: 308, name: 'Universidad Católica', location: 'Chile', strength: 75, logo_url: '/assets/logos/u-catolica.png' },
  { id: 309, name: 'Independiente', location: 'Argentina', strength: 77, logo_url: '/assets/logos/independiente.png' },
  { id: 310, name: 'Racing', location: 'Argentina', strength: 76, logo_url: '/assets/logos/racing.png' },
  { id: 311, name: 'LDU Quito', location: 'Equador', strength: 74, logo_url: '/assets/logos/ldu-quito.png' },
  { id: 312, name: 'Barcelona SC', location: 'Equador', strength: 73, logo_url: '/assets/logos/barcelona-sc.png' },
  { id: 313, name: 'The Strongest', location: 'Bolívia', strength: 70, logo_url: '/assets/logos/the-strongest.png' },
  { id: 314, name: 'Bolívar', location: 'Bolívia', strength: 71, logo_url: '/assets/logos/bolivar.png' },
  { id: 315, name: 'Deportivo Táchira', location: 'Venezuela', strength: 69, logo_url: '/assets/logos/dep-tachira.png' },
  { id: 316, name: 'Caracas FC', location: 'Venezuela', strength: 68, logo_url: '/assets/logos/caracas-fc.png' },
  { id: 317, name: 'Atlético Nacional', location: 'Colômbia', strength: 78, logo_url: '/assets/logos/atletico-nacional.png' },
  { id: 318, name: 'Millonarios', location: 'Colômbia', strength: 77, logo_url: '/assets/logos/millonarios.png' },
  { id: 319, name: 'Santa Fe', location: 'Colômbia', strength: 76, logo_url: '/assets/logos/santa-fe.png' },
  { id: 320, name: 'Deportivo Cali', location: 'Colômbia', strength: 75, logo_url: '/assets/logos/deportivo-cali.png' },
  
];

// Times do Mundial (times europeus e de outros continentes)
const mundialTeams = [
  { id: 401, name: 'Real Madrid', location: 'Espanha', strength: 89, logo_url: '/assets/logos/real-madrid.png' },
  { id: 402, name: 'Manchester City', location: 'Inglaterra', strength: 88, logo_url: '/assets/logos/man-city.png' },
  { id: 403, name: 'Bayern Munich', location: 'Alemanha', strength: 87, logo_url: '/assets/logos/bayern-munich.png' },
  { id: 404, name: 'Barcelona', location: 'Espanha', strength: 86, logo_url: '/assets/logos/barcelona.png' },
  { id: 405, name: 'Liverpool', location: 'Inglaterra', strength: 86, logo_url: '/assets/logos/liverpool.png' },
  { id: 406, name: 'PSG', location: 'França', strength: 85, logo_url: '/assets/logos/psg.png' },
  { id: 407, name: 'Al Ahly', location: 'Egito', strength: 75, logo_url: '/assets/logos/al-ahly.png' },
  { id: 408, name: 'Wydad Casablanca', location: 'Marrocos', strength: 74, logo_url: '/assets/logos/wydad.png' },
  { id: 409, name: 'Monterrey', location: 'México', strength: 76, logo_url: '/assets/logos/monterrey.png' },
  { id: 410, name: 'Al-Hilal', location: 'Arábia Saudita', strength: 77, logo_url: '/assets/logos/al-hilal.png' },
  { id: 411, name: 'Urawa Red Diamonds', location: 'Japão', strength: 74, logo_url: '/assets/logos/urawa-reds.png' },
  { id: 412, name: 'Auckland City', location: 'Nova Zelândia', strength: 70, logo_url: '/assets/logos/auckland-city.png' },
];

// Times da Série B 
const brasileiraoBTeams = [
  { id: 220, name: 'Ceará', location: 'Ceará', strength: 69, logo_url: '/assets/logos/ceara.png' },
  { id: 221, name: 'Sport Recife', location: 'Pernambuco', strength: 69, logo_url: '/assets/logos/sport.png' },
  { id: 222, name: 'América-MG', location: 'Minas Gerais', strength: 68, logo_url: '/assets/logos/america-mg.png' },
  { id: 223, name: 'Vila Nova', location: 'Goiás', strength: 67, logo_url: '/assets/logos/vila-nova.png' },
  { id: 224, name: 'Goiás', location: 'Goiás', strength: 67, logo_url: '/assets/logos/goias.png' },
  { id: 225, name: 'Operário-PR', location: 'Paraná', strength: 66, logo_url: '/assets/logos/operario.png' },
  { id: 226, name: 'Coritiba', location: 'Paraná', strength: 68, logo_url: '/assets/logos/coritiba.png' },
  { id: 227, name: 'CRB', location: 'Alagoas', strength: 65, logo_url: '/assets/logos/crb.png' },
  { id: 228, name: 'Avaí', location: 'Santa Catarina', strength: 66, logo_url: '/assets/logos/avai.png' },
  { id: 229, name: 'Chapecoense', location: 'Santa Catarina', strength: 65, logo_url: '/assets/logos/chapecoense.png' },
];

// Times da Série C
const brasileiraoCTeams = [
  { id: 230, name: 'Paysandu', location: 'Pará', strength: 64, logo_url: '/assets/logos/paysandu.png' },
  { id: 231, name: 'Remo', location: 'Pará', strength: 63, logo_url: '/assets/logos/remo.png' },
  { id: 232, name: 'ABC', location: 'Rio Grande do Norte', strength: 62, logo_url: '/assets/logos/abc.png' },
  { id: 233, name: 'Náutico', location: 'Pernambuco', strength: 62, logo_url: '/assets/logos/nautico.png' },
  { id: 234, name: 'Figueirense', location: 'Santa Catarina', strength: 63, logo_url: '/assets/logos/figueirense.png' },
  { id: 235, name: 'CSA', location: 'Alagoas', strength: 62, logo_url: '/assets/logos/csa.png' },
  { id: 236, name: 'Londrina', location: 'Paraná', strength: 61, logo_url: '/assets/logos/londrina.png' },
  { id: 237, name: 'Ferroviária', location: 'São Paulo', strength: 60, logo_url: '/assets/logos/ferroviaria.png' },
];

// Campeões estaduais e times de divisões inferiores
const outrosTeams = [
  { id: 240, name: 'Ferroviário-CE', location: 'Ceará', strength: 58, logo_url: '/assets/logos/ferroviario.png' },
  { id: 241, name: 'Tombense', location: 'Minas Gerais', strength: 59, logo_url: '/assets/logos/tombense.png' },
  { id: 242, name: 'Manaus', location: 'Amazonas', strength: 57, logo_url: '/assets/logos/manaus.png' },
  { id: 243, name: 'Brasiliense', location: 'Distrito Federal', strength: 56, logo_url: '/assets/logos/brasiliense.png' },
  { id: 244, name: 'Sampaio Corrêa', location: 'Maranhão', strength: 60, logo_url: '/assets/logos/sampaio-correa.png' },
  { id: 245, name: 'São José-RS', location: 'Rio Grande do Sul', strength: 55, logo_url: '/assets/logos/sao-jose-rs.png' },
  { id: 246, name: 'Altos-PI', location: 'Piauí', strength: 54, logo_url: '/assets/logos/altos.png' },
  { id: 247, name: 'Juazeirense', location: 'Bahia', strength: 53, logo_url: '/assets/logos/juazeirense.png' },
  { id: 248, name: 'Nova Iguaçu', location: 'Rio de Janeiro', strength: 55, logo_url: '/assets/logos/nova-iguacu.png' },
  { id: 249, name: 'Real Noroeste', location: 'Espírito Santo', strength: 52, logo_url: '/assets/logos/real-noroeste.png' },
];

// Função para inserir os times no banco de dados
async function seedTeams() {
  try {
    // Configuração do banco de dados
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'AQWzsx2éàé(1', // Sua senha
      database: 'ifoot',
      port: 3306,
    });
    
    console.log("Conexão com o banco de dados estabelecida!");
    
    // Combinar todos os times em uma única lista
    const allTeams = [
      ...brasileiraoTeams,
      ...paulistaoTeams.filter(team => !brasileiraoTeams.some(bt => bt.name === team.name)),
      ...libertadoresTeams,
      ...mundialTeams,
      ...brasileiraoBTeams,
      ...brasileiraoCTeams,
      ...outrosTeams
    ];
    
    // Inserir times na tabela teams
    console.log("Inserindo times no banco de dados...");
    
    for (const team of allTeams) {
      try {
        await connection.execute(
          'INSERT INTO teams (id, name, location, strength, logo_url, is_user_team) VALUES (?, ?, ?, ?, ?, FALSE) ' +
          'ON DUPLICATE KEY UPDATE name = VALUES(name), location = VALUES(location), strength = VALUES(strength), logo_url = VALUES(logo_url)',
          [team.id, team.name, team.location, team.strength, team.logo_url]
        );
        console.log(`Time inserido: ${team.name}`);
      } catch (error) {
        console.error(`Erro ao inserir time ${team.name}:`, error.message);
      }
    }
    
    console.log("Inserção de times concluída!");
    
    // Fechar a conexão
    await connection.end();
    console.log("Conexão fechada.");
    
  } catch (error) {
    console.error("Erro durante a execução:", error);
  }
}

// Função para associar os times às competições
async function associateTeamsToCompetitions() {
  try {
    // Configuração do banco de dados
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'AQWzsx2éàé(1', // Sua senha
      database: 'ifoot',
      port: 3306,
    });
    
    console.log("Conexão com o banco de dados estabelecida!");
    
    // Obter competições ativas
    const [competitions] = await connection.execute(
      'SELECT id, name, type FROM competitions WHERE status = "active"'
    );
    
    if (competitions.length === 0) {
      console.log("Não há competições ativas para associar times.");
      await connection.end();
      return;
    }
    
    // Associar times às competições correspondentes
    for (const competition of competitions) {
      try {
        let teamsToAssociate = [];
        
        // Selecionar times baseado no tipo de competição
        if (competition.type === 'nacional') {
          teamsToAssociate = brasileiraoTeams.map(team => team.id);
        } else if (competition.type === 'estadual' && competition.name.includes('Paulistão')) {
          teamsToAssociate = [
            ...brasileiraoTeams.filter(team => team.location === 'São Paulo').map(team => team.id),
            ...paulistaoTeams.map(team => team.id)
          ];
        } else if (competition.type === 'continental') {
          teamsToAssociate = [
            ...brasileiraoTeams.slice(0, 6).map(team => team.id), // Top 6 do brasileirão
            ...libertadoresTeams.map(team => team.id)
          ];
        } else if (competition.type === 'mundial') {
          teamsToAssociate = [
            brasileiraoTeams[0].id, // Campeão brasileiro (para o exemplo)
            libertadoresTeams[0].id, // Campeão da Libertadores (para o exemplo)
            ...mundialTeams.map(team => team.id)
          ];
        } else if (competition.type === 'copa') {
          teamsToAssociate = brasileiraoTeams.map(team => team.id); // Todos os times brasileiros
        }
        
        // Inserir associações na tabela competition_teams
        for (const teamId of teamsToAssociate) {
          try {
            await connection.execute(
              'INSERT IGNORE INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
              [competition.id, teamId]
            );
            console.log(`Time ${teamId} associado à competição ${competition.name}`);
          } catch (error) {
            console.error(`Erro ao associar time ${teamId} à competição ${competition.name}:`, error.message);
          }
        }
        
        console.log(`Times associados à competição ${competition.name}`);
      } catch (error) {
        console.error(`Erro ao processar competição ${competition.name}:`, error);
      }
    }
    
    console.log("Associação de times às competições concluída!");
    
    // Fechar a conexão
    await connection.end();
    console.log("Conexão fechada.");
    
  } catch (error) {
    console.error("Erro durante a execução:", error);
  }
}

// Exportar funções
module.exports = {
  seedTeams,
  associateTeamsToCompetitions,
  // Exportar as listas para uso em outros lugares
  brasileiraoTeams,
  paulistaoTeams,
  libertadoresTeams,
  mundialTeams,
  brasileiraoBTeams,
  brasileiraoCTeams,
  outrosTeams
};

// Se executado diretamente (não importado)
if (require.main === module) {
  // Execute as funções em sequência
  seedTeams()
    .then(() => {
      console.log("\nAguarde 2 segundos antes de associar os times às competições...");
      setTimeout(associateTeamsToCompetitions, 2000);
    })
    .catch(console.error);
}