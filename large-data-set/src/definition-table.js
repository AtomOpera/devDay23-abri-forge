import ForgeUI, { Cell, Head, Row, Table, Text } from "@forge/ui";

// Definition row renders a single row in the definitions table for a specific term
const DefinitionRow = ({ issueKey, summary }) => {
  // Render a row with the term and definition
  return (
    <Row>
      <Cell>
        <Text>{issueKey}</Text>
      </Cell>

      <Cell>
        <Text>{summary}</Text>
      </Cell>
    </Row>
  );
};

// Render a definitions table given a list of issue keys and summaries
export const DefinitionTable = ({ issueKeys, summaries }) => {
    // Render a definition row for each term
    const definitionRows = issueKeys.map((issueKey, i) => (
      <DefinitionRow issueKey={issueKey} summary={summaries[i]} />
    ));
   
    // Return a table with the list of definitions
    return (
      <Table>
        <Head>
          <Cell>
            <Text>Issue Key</Text>
          </Cell>
          <Cell>
            <Text>Summary</Text>
          </Cell>
        </Head>
        {definitionRows}
      </Table>
    );
   };