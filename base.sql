CREATE DATABASE IF NOT EXISTS ifoot;
USE ifoot;

CREATE TABLE IF NOT EXISTS jogadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(50) NOT NULL,
  age INT,
  nationality VARCHAR(50),
  overall INT,
  club VARCHAR(100),
  photo_url VARCHAR(255),
  height FLOAT,
  weight FLOAT,
  foot VARCHAR(10)
);

USE ifoot;
SELECT * FROM jogadores;

ALTER TABLE jogadores
MODIFY name VARCHAR(100) NOT NULL,
MODIFY position VARCHAR(50) NOT NULL,
MODIFY nationality VARCHAR(50) NOT NULL,
MODIFY overall INT NOT NULL,
MODIFY club VARCHAR(100) NOT NULL,
MODIFY photo_url VARCHAR(255) NOT NULL,
MODIFY foot VARCHAR(10) NOT NULL;

ALTER TABLE jogadores ADD UNIQUE (name, club);

INSERT INTO jogadores (name, position, age, nationality, overall, club, photo_url, height, weight, foot)
VALUES
('Alisson', 'Goleiro', 31, 'Brasil', 88, 'Liverpool', 'https://url-da-foto.com/alisson.jpg', 1.91, 91, 'Direito'),
('Marquinhos', 'Zagueiro', 29, 'Brasil', 85, 'PSG', 'https://url-da-foto.com/marquinhos.jpg', 1.83, 79, 'Direito'),
('Casemiro', 'Volante', 32, 'Brasil', 87, 'Manchester United', 'https://url-da-foto.com/casemiro.jpg', 1.85, 84, 'Direito');

INSERT INTO jogadores (name, position, age, nationality, overall, club, photo_url, height, weight, foot) VALUES
('Rafael', 'Goleiro', 34, 'Brasil', 80, 'São Paulo', 'https://spfc.com.br/fotos/rafael.jpg', 1.92, 88, 'Direito'),
('Jandrei', 'Goleiro', 31, 'Brasil', 77, 'São Paulo', 'https://spfc.com.br/fotos/jandrei.jpg', 1.86, 82, 'Direito'),
('Lucas Perri', 'Goleiro', 26, 'Brasil', 76, 'São Paulo', 'https://spfc.com.br/fotos/perri.jpg', 1.97, 90, 'Direito'),

('Arboleda', 'Zagueiro', 32, 'Equador', 81, 'São Paulo', 'https://spfc.com.br/fotos/arboleda.jpg', 1.89, 84, 'Direito'),
('Ferraresi', 'Zagueiro', 25, 'Venezuela', 78, 'São Paulo', 'https://spfc.com.br/fotos/ferraresi.jpg', 1.88, 80, 'Direito'),
('Alan Franco', 'Zagueiro', 27, 'Argentina', 79, 'São Paulo', 'https://spfc.com.br/fotos/franco.jpg', 1.85, 78, 'Direito'),
('Diego Costa', 'Zagueiro', 25, 'Brasil', 77, 'São Paulo', 'https://spfc.com.br/fotos/diegocosta.jpg', 1.84, 80, 'Direito'),

('Wellington', 'Lateral', 23, 'Brasil', 76, 'São Paulo', 'https://spfc.com.br/fotos/wellington.jpg', 1.78, 74, 'Esquerdo'),
('Igor Vinícius', 'Lateral', 27, 'Brasil', 77, 'São Paulo', 'https://spfc.com.br/fotos/igorvinicius.jpg', 1.75, 72, 'Direito'),
('Patryck', 'Lateral', 21, 'Brasil', 74, 'São Paulo', 'https://spfc.com.br/fotos/patryck.jpg', 1.77, 70, 'Esquerdo'),
('Moreira', 'Lateral', 19, 'Portugal', 72, 'São Paulo', 'https://spfc.com.br/fotos/moreira.jpg', 1.80, 73, 'Direito'),

('Alisson', 'Meia', 30, 'Brasil', 78, 'São Paulo', 'https://spfc.com.br/fotos/alisson.jpg', 1.75, 70, 'Direito'),
('Pablo Maia', 'Meia', 22, 'Brasil', 79, 'São Paulo', 'https://spfc.com.br/fotos/pablomaia.jpg', 1.78, 74, 'Direito'),
('Michel Araújo', 'Meia', 27, 'Uruguai', 77, 'São Paulo', 'https://spfc.com.br/fotos/michelaraujo.jpg', 1.80, 75, 'Direito'),
('Rodrigo Nestor', 'Meia', 23, 'Brasil', 78, 'São Paulo', 'https://spfc.com.br/fotos/nestor.jpg', 1.76, 72, 'Esquerdo'),
('Neves', 'Meia', 22, 'Brasil', 75, 'São Paulo', 'https://spfc.com.br/fotos/neves.jpg', 1.77, 73, 'Direito'),

('Luciano', 'Atacante', 31, 'Brasil', 80, 'São Paulo', 'https://spfc.com.br/fotos/luciano.jpg', 1.81, 78, 'Direito'),
('Calleri', 'Atacante', 30, 'Argentina', 82, 'São Paulo', 'https://spfc.com.br/fotos/calleri.jpg', 1.84, 81, 'Direito'),
('Erison', 'Atacante', 25, 'Brasil', 76, 'São Paulo', 'https://spfc.com.br/fotos/erison.jpg', 1.80, 77, 'Direito'),
('Ferreirinha', 'Atacante', 26, 'Brasil', 77, 'São Paulo', 'https://spfc.com.br/fotos/ferreirinha.jpg', 1.75, 70, 'Direito'),
('André Silva', 'Atacante', 26, 'Brasil', 75, 'São Paulo', 'https://spfc.com.br/fotos/andresilva.jpg', 1.78, 73, 'Direito'),
('Juan', 'Atacante', 22, 'Brasil', 74, 'São Paulo', 'https://spfc.com.br/fotos/juan.jpg', 1.80, 75, 'Direito');

