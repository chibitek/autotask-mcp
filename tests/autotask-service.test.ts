// Autotask Service Tests
// Tests for the AutotaskService wrapper

jest.mock('autotask-node', () => ({
  AutotaskClient: {
    create: jest.fn().mockRejectedValue(new Error('Mock: Cannot connect to Autotask API'))
  }
}));

import { AutotaskService } from '../src/services/autotask.service';
import { Logger } from '../src/utils/logger';
import type { McpServerConfig } from '../src/types/mcp';

const mockConfig: McpServerConfig = {
  name: 'test-server',
  version: '1.0.0',
  autotask: {
    username: 'test-username',
    secret: 'test-secret', 
    integrationCode: 'test-integration-code'
  }
};

// Create a proper mock logger
const mockLogger = new Logger('error'); // Use error level to suppress logs during tests

describe('AutotaskService', () => {
  test('should be instantiable', () => {
    const service = new AutotaskService(mockConfig, mockLogger);
    expect(service).toBeInstanceOf(AutotaskService);
    expect(mockConfig.name).toBe('test-server');
  });

  test('should validate required configuration', async () => {
    const invalidConfig = { ...mockConfig };
    delete invalidConfig.autotask.username;
    
    const service = new AutotaskService(invalidConfig, mockLogger);
    await expect(service.initialize()).rejects.toThrow('Missing required Autotask credentials');
  });

  test('should handle connection failure gracefully', async () => {
    const service = new AutotaskService(mockConfig, mockLogger);
    const result = await service.testConnection();
    expect(result).toBe(false);
  });

  test('should have all expected methods', () => {
    const service = new AutotaskService(mockConfig, mockLogger);
    
    // Test presence of key methods
    expect(typeof service.getCompany).toBe('function');
    expect(typeof service.searchCompanies).toBe('function');
    expect(typeof service.createCompany).toBe('function');
    expect(typeof service.updateCompany).toBe('function');
    
    expect(typeof service.getContact).toBe('function');
    expect(typeof service.searchContacts).toBe('function');
    expect(typeof service.createContact).toBe('function');
    expect(typeof service.updateContact).toBe('function');
    
    expect(typeof service.getTicket).toBe('function');
    expect(typeof service.searchTickets).toBe('function');
    expect(typeof service.createTicket).toBe('function');
    expect(typeof service.updateTicket).toBe('function');
    
    expect(typeof service.createTimeEntry).toBe('function');
    expect(typeof service.getTimeEntries).toBe('function');
    
    expect(typeof service.getProject).toBe('function');
    expect(typeof service.searchProjects).toBe('function');
    expect(typeof service.createProject).toBe('function');
    expect(typeof service.updateProject).toBe('function');
    
    expect(typeof service.getResource).toBe('function');
    expect(typeof service.searchResources).toBe('function');
    
    expect(typeof service.getConfigurationItem).toBe('function');
    expect(typeof service.searchConfigurationItems).toBe('function');
    expect(typeof service.createConfigurationItem).toBe('function');
    expect(typeof service.updateConfigurationItem).toBe('function');
    
    expect(typeof service.getContract).toBe('function');
    expect(typeof service.searchContracts).toBe('function');
    
    expect(typeof service.getInvoice).toBe('function');
    expect(typeof service.searchInvoices).toBe('function');
    expect(typeof service.getInvoiceDetails).toBe('function');
    
    expect(typeof service.getTask).toBe('function');
    expect(typeof service.searchTasks).toBe('function');
    expect(typeof service.createTask).toBe('function');
    expect(typeof service.updateTask).toBe('function');
    
    expect(typeof service.testConnection).toBe('function');
  });

  // Tests for new entity methods
  describe('New Entity Methods', () => {
    test('should handle notes methods with proper error messages', async () => {
      const service = new AutotaskService(mockConfig, mockLogger);
      
      // Test ticket notes
      await expect(service.getTicketNote(123, 456)).rejects.toThrow();
      await expect(service.searchTicketNotes(123)).rejects.toThrow();
      await expect(service.createTicketNote(123, { title: 'Test', description: 'Test note' })).rejects.toThrow();
      
      // Test project notes
      await expect(service.getProjectNote(123, 456)).rejects.toThrow();
      await expect(service.searchProjectNotes(123)).rejects.toThrow();
      await expect(service.createProjectNote(123, { title: 'Test', description: 'Test note' })).rejects.toThrow();
      
      // Test company notes
      await expect(service.getCompanyNote(123, 456)).rejects.toThrow();
      await expect(service.searchCompanyNotes(123)).rejects.toThrow();
      await expect(service.createCompanyNote(123, { title: 'Test', description: 'Test note' })).rejects.toThrow();
    });

    test('should handle attachment methods with proper error messages', async () => {
      const service = new AutotaskService(mockConfig, mockLogger);
      
      await expect(service.getTicketAttachment(123, 456)).rejects.toThrow();
      await expect(service.searchTicketAttachments(123)).rejects.toThrow();
    });

    test('should handle expense methods with proper error messages', async () => {
      const service = new AutotaskService(mockConfig, mockLogger);
      
      await expect(service.getExpenseReport(123)).rejects.toThrow();
      await expect(service.searchExpenseReports()).rejects.toThrow();
      await expect(service.createExpenseReport({ name: 'Test Report', submitterID: 123 })).rejects.toThrow();
      
      // Expense items should throw specific error
      await expect(service.getExpenseItem(123, 456)).rejects.toThrow('Expense items API not yet implemented');
      await expect(service.searchExpenseItems(123)).rejects.toThrow('Expense items API not yet implemented');
      await expect(service.createExpenseItem(123, { description: 'Test', expenseDate: '2024-01-01', expenseAmount: 100 })).rejects.toThrow('Expense items API not yet implemented');
    });

    test('should handle quote methods with proper error messages', async () => {
      const service = new AutotaskService(mockConfig, mockLogger);
      
      await expect(service.getQuote(123)).rejects.toThrow();
      await expect(service.searchQuotes()).rejects.toThrow();
      await expect(service.createQuote({ name: 'Test Quote', companyID: 123 })).rejects.toThrow();
    });

    test('should handle unsupported entity methods with proper error messages', async () => {
      const service = new AutotaskService(mockConfig, mockLogger);
      
      // Billing codes
      await expect(service.getBillingCode(123)).rejects.toThrow('Billing codes API not directly available');
      await expect(service.searchBillingCodes()).rejects.toThrow('Billing codes API not directly available');
      
      // Departments
      await expect(service.getDepartment(123)).rejects.toThrow('Departments API not directly available');
      await expect(service.searchDepartments()).rejects.toThrow('Departments API not directly available');
    });
  });

  describe('Invoice details and billing item filters', () => {
    function makeServiceWithMockClient(mockClient: any) {
      const service = new AutotaskService(mockConfig, mockLogger);
      (service as any).client = mockClient;
      return service;
    }

    test('getInvoiceDetails composes line items via includeItemsAndExpenses', async () => {
      const invoice = { id: 42, invoiceNumber: 'INV-42', totalAmount: 100 };
      const embeddedItems = [
        { id: 1, invoiceID: 42, itemName: 'Labor', extendedPrice: 80 },
        { id: 2, invoiceID: 42, itemName: 'Parts', extendedPrice: 20 },
      ];
      const axiosGet = jest.fn().mockResolvedValue({
        data: { item: { ...invoice, items: embeddedItems } },
      });
      const mockClient = {
        axios: { get: axiosGet },
        invoices: { get: jest.fn() },
        billingItems: { list: jest.fn() },
      };
      const service = makeServiceWithMockClient(mockClient);

      const result = await service.getInvoiceDetails(42);
      expect(axiosGet).toHaveBeenCalledWith('/Invoices/42', {
        params: { includeItemsAndExpenses: true },
      });
      expect(result?.id).toBe(42);
      expect(result?.lineItems).toHaveLength(2);
      expect(result?.lineItems?.[0].itemName).toBe('Labor');
      // Should not have needed a fallback billingItems query
      expect(mockClient.billingItems.list).not.toHaveBeenCalled();
    });

    test('getInvoiceDetails falls back to BillingItems query when items not embedded', async () => {
      const invoice = { id: 7, invoiceNumber: 'INV-7' };
      const axiosGet = jest.fn().mockResolvedValue({ data: { item: invoice } });
      const biList = jest.fn().mockResolvedValue({
        data: [{ id: 99, invoiceID: 7, itemName: 'Fallback' }],
      });
      const mockClient = {
        axios: { get: axiosGet },
        invoices: { get: jest.fn() },
        billingItems: { list: biList },
      };
      const service = makeServiceWithMockClient(mockClient);

      const result = await service.getInvoiceDetails(7);
      expect(biList).toHaveBeenCalledTimes(1);
      const biArgs = biList.mock.calls[0][0];
      expect(biArgs.filter).toContainEqual({
        op: 'eq',
        field: 'invoiceID',
        value: 7,
      });
      expect(result?.lineItems).toHaveLength(1);
      expect(result?.lineItems?.[0].itemName).toBe('Fallback');
    });

    test('searchBillingItems translates isInvoiced and date range into filters', async () => {
      const listMock = jest.fn().mockResolvedValue({ data: [] });
      const mockClient = {
        billingItems: { list: listMock },
      };
      const service = makeServiceWithMockClient(mockClient);

      await service.searchBillingItems({
        isInvoiced: false,
        ticketId: 555,
        projectId: 777,
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      } as any);

      expect(listMock).toHaveBeenCalledTimes(1);
      const query = listMock.mock.calls[0][0];
      const filters = query.filter;

      expect(filters).toContainEqual({ op: 'notExist', field: 'invoiceID' });
      expect(filters).toContainEqual({ op: 'eq', field: 'ticketID', value: 555 });
      expect(filters).toContainEqual({ op: 'eq', field: 'projectID', value: 777 });
      expect(filters).toContainEqual({
        op: 'gte',
        field: 'itemDate',
        value: '2026-01-01',
      });
      expect(filters).toContainEqual({
        op: 'lte',
        field: 'itemDate',
        value: '2026-01-31',
      });
    });

    test('searchBillingItems emits exist filter when isInvoiced=true', async () => {
      const listMock = jest.fn().mockResolvedValue({ data: [] });
      const mockClient = { billingItems: { list: listMock } };
      const service = makeServiceWithMockClient(mockClient);

      await service.searchBillingItems({ isInvoiced: true } as any);
      const filters = listMock.mock.calls[0][0].filter;
      expect(filters).toContainEqual({ op: 'exist', field: 'invoiceID' });
    });
  });
});
