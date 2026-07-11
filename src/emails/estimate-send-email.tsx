import { Body, Container, Head, Html, Preview, Section, Text } from "react-email";

export type EstimateSendEmailProps = {
  estimateName: string;
  customerName?: string | null;
  companyName: string;
  estimateNumber?: string | null;
  generatedAt: string;
};

export function EstimateSendEmail({
  estimateName,
  customerName,
  companyName,
  estimateNumber,
  generatedAt,
}: EstimateSendEmailProps) {
  const greetingName = customerName?.trim() ? customerName.trim() : "";

  return (
    <Html>
      <Head />
      <Preview>
        {estimateName} - wycena od {companyName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={paragraph}>Dzień dobry{greetingName ? ` ${greetingName}` : ""},</Text>
            <Text style={paragraph}>
              Przygotowaliśmy dla Państwa wycenę: <strong>{estimateName}</strong>.
            </Text>
            {estimateNumber ? (
              <Text style={paragraph}>
                Numer wyceny: <strong>{estimateNumber}</strong>
              </Text>
            ) : null}
            <Text style={paragraph}>Data wygenerowania: {generatedAt}</Text>
            <Text style={paragraph}>
              W załączeniu przesyłamy dokument PDF z pełną treścią wyceny.
            </Text>
            <Text style={paragraph}>W razie pytań pozostajemy do dyspozycji.</Text>
            <Text style={paragraph}>
              Pozdrawiamy,
              <br />
              {companyName}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "24px",
  marginBottom: "64px",
  borderRadius: "8px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#334155",
};
