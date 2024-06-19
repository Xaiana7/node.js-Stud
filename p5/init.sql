create DATABASE "node_postgres";

create TABLE links (
    id SERIAL PRIMARY KEY,
    link VARCHAR(512) UNIQUE
);

create TABLE users (
    id SERIAL PRIMARY KEY,
    lgn VARCHAR(512) UNIQUE,
    pswd VARCHAR(512) UNIQUE
);