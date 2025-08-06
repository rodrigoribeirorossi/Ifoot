// Criar este arquivo para executar uma única vez

const mysql = require('mysql2/promise');

async function cleanupTeams() {
  // Configuração de conexão
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'AQWzsx2éàé(1',
    database: 'ifoot_simple',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log("Conectando ao banco de dados...");
    const connection = await pool.getConnection();
    
    try {
      // 1. Encontrar o time do usuário atual
      const [userTeam] = await connection.query(
        'SELECT id, name FROM user_teams LIMIT 1'
      );
      
      if (userTeam.length === 0) {
        console.log("Nenhum time do usuário encontrado!");
        return;
      }
      
      const userTeamId = userTeam[0].id;
      const userTeamName = userTeam[0].name;
      
      console.log(`Time atual do usuário: ${userTeamName} (ID: ${userTeamId})`);
      
      // 2. Marcar apenas este time como time do usuário e os demais como não-usuário
      await connection.query(
        'UPDATE teams SET is_user_team = (id = ?)',
        [userTeamId]
      );
      
      console.log("Times atualizados: apenas o time ID", userTeamId, "marcado como do usuário");
      
      // 3. Renomear ou remover o time "Meu Time Histórico" se existir
      const [historicTeam] = await connection.query(
        'SELECT id FROM teams WHERE name LIKE "%Histórico%" OR name LIKE "%historico%"'
      );
      
      if (historicTeam.length > 0) {
        // Opção 1: Renomear o time
        await connection.query(
          'UPDATE teams SET name = CONCAT(name, " (CPU)") WHERE id = ?',
          [historicTeam[0].id]
        );
        
        console.log(`Time histórico ID ${historicTeam[0].id} renomeado para evitar conflitos`);
        
        // Opção 2 (alternativa): Remover o time completamente
        // Descomente as linhas abaixo se preferir REMOVER o time em vez de renomeá-lo
        /*
        await connection.query(
          'DELETE FROM matches WHERE home_team_id = ? OR away_team_id = ?', 
          [historicTeam[0].id, historicTeam[0].id]
        );
        
        await connection.query(
          'DELETE FROM teams WHERE id = ?',
          [historicTeam[0].id]
        );
        
        console.log(`Time histórico ID ${historicTeam[0].id} removido completamente`);
        */
      } else {
        console.log("Nenhum time histórico encontrado");
      }
      
      console.log("Operação concluída com sucesso!");
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    pool.end();
  }
}

// Executar a função
cleanupTeams();