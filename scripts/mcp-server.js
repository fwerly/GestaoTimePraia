/**
 * EXEMPLO DE SERVIDOR MCP PARA SUPABASE
 * 
 * Este arquivo é um TEMPLATE. Se você quiser usar MCP (Model Context Protocol)
 * para conectar seu banco de dados diretamente ao Claude Desktop ou Cursor:
 * 
 * 1. Instale as dependências: 
 *    npm install @modelcontextprotocol/sdk zod pg
 * 
 * 2. Crie um arquivo .env com:
 *    DATABASE_URL=postgres://postgres:[SUA_SENHA]@db.[SEU_PROJETO].supabase.co:5432/postgres
 * 
 * 3. Descomente o código abaixo e rode: 
 *    node scripts/mcp-server.js
 */

/*
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";

const server = new McpServer({
  name: "GestaoTime Supabase",
  version: "1.0.0",
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ferramenta para ler o Schema
server.tool(
  "get-schema",
  "Get the database schema information",
  {},
  async () => {
    const query = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    try {
      const client = await pool.connect();
      const result = await client.query(query);
      client.release();
      return { content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// Ferramenta para rodar Queries (Read-Only)
server.tool(
  "query-database",
  "Execute a read-only SQL query on the Supabase database",
  { query: z.string().describe("The SQL query to execute") },
  async ({ query }) => {
    // Trava de segurança simples
    if (!query.trim().toLowerCase().startsWith("select")) {
      return { content: [{ type: "text", text: "Only SELECT queries are allowed for safety." }] };
    }
    try {
      const client = await pool.connect();
      const result = await client.query(query);
      client.release();
      return { content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on Stdio");
}

main();
*/
