import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col } from 'react-grid-system';

const ResponsiveWrapper = ({ children }) => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Container>
        <Row className="mb-8">
          <Col xs={12}>
            <h1 className="text-3xl font-bold">{t('Dashboard')}</h1>
          </Col>
        </Row>
        
        <Row>
          <Col xs={12} md={3}>
            {/* Sidebar */}
            {children.sidebar}
          </Col>
          
          <Col xs={12} md={9}>
            {/* Main Content */}
            {children.main}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ResponsiveWrapper;