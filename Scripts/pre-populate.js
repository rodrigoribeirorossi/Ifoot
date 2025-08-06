/**
 * Script para pré-popular o banco de dados com todos os dados necessários
 */
const mysql = require('mysql2/promise');
const { brasileiraoTeams, paulistaoTeams } = require('./seed-data');

async function prepopulateDatabase() {
  try {
    // Conectar ao banco de dados - AJUSTE AS CREDENCIAIS AQUI
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'AQWzsx2éàé(1',
      database: 'ifoot_simple',
      port: 3306,
    });
    
    console.log("Iniciando pré-populamento da base de dados...");
    
    // 1. Criar temporada fixa 2024
    await connection.query("INSERT INTO seasons (year, is_current, status) VALUES (2024, 1, 'upcoming')");
    
    console.log("Temporada 2024 criada");
    
    // 2. Criar competições fixas
    const competitions = [
      { id: 1, name: 'Paulistão A1', type: 'estadual', season_id: 1, format: 'league' },
      { id: 2, name: 'Brasileirão Série A', type: 'nacional', season_id: 1, format: 'league' },
      { id: 3, name: 'Copa do Brasil', type: 'copa', season_id: 1, format: 'knockout' },
      { id: 4, name: 'Copa Libertadores', type: 'continental', season_id: 1, format: 'group_knockout' },
      { id: 5, name: 'Mundial de Clubes', type: 'mundial', season_id: 1, format: 'knockout' }
    ];
    
    for (const comp of competitions) {
      await connection.query(
        'INSERT INTO competitions (id, name, type, season_id, format, status) VALUES (?, ?, ?, ?, ?, ?)',
        [comp.id, comp.name, comp.type, comp.season_id, comp.format, 'upcoming']
      );
      
      // Criar entrada correspondente na tabela tournaments
      await connection.query(
        'INSERT INTO tournaments (id, name) VALUES (?, ?)',
        [comp.id, comp.name]
      );
    }
    
    console.log("Competições criadas");
    
    // 3. Inserir todos os times
    const allTeams = [
      ...brasileiraoTeams,
      ...paulistaoTeams
    ];
    
    for (const team of allTeams) {
      await connection.query(
        'INSERT IGNORE INTO teams (id, name, location, strength, logo_url, is_user_team) VALUES (?, ?, ?, ?, ?, 0)',
        [team.id, team.name, team.location, team.strength, team.logo_url]
      );
    }
    
    console.log("Times inseridos");
    
    // 4. Associar times às competições
    // Associar times ao Paulistão (15 times)
    const paulistaoTeamIds = paulistaoTeams.map(team => team.id);
    for (const teamId of paulistaoTeamIds) {
      await connection.query(
        'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
        [1, teamId]
      );
    }
    
    // Associar times ao Brasileirão (19 times)
    const brasileiraoTeamIds = brasileiraoTeams.map(team => team.id);
    for (const teamId of brasileiraoTeamIds) {
      await connection.query(
        'INSERT INTO competition_teams (competition_id, team_id) VALUES (?, ?)',
        [2, teamId]
      );
    }
    
    console.log("Times associados às competições");
    
    await connection.end();
    console.log("Base de dados pré-populada com sucesso!");
    
  } catch (error) {
    console.error("Erro ao pré-popular banco de dados:", error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  prepopulateDatabase();
}

module.exports = { prepopulateDatabase };