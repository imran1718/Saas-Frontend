const authService = require('../../src/services/auth.service');
const tenantRepository = require('../../src/repositories/tenant.repository');
const userRepository = require('../../src/repositories/user.repository');
const emailService = require('../../src/services/email.service');
const tokenService = require('../../src/services/token.service');
const { sequelize } = require('../../src/models');

jest.mock('../../src/repositories/tenant.repository');
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/services/email.service');
jest.mock('../../src/services/token.service');
jest.mock('../../src/models', () => ({
  sequelize: {
    transaction: jest.fn((cb) => cb()),
  },
}));

describe('Auth Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictError if subdomain is taken', async () => {
      tenantRepository.findBySubdomain.mockResolvedValue({ id: '1' });
      await expect(
        authService.register({ subdomain: 'test' })
      ).rejects.toThrow('This subdomain is already in use');
    });

    it('should successfully register and send verification email', async () => {
      tenantRepository.findBySubdomain.mockResolvedValue(null);
      tenantRepository.create.mockResolvedValue({ id: 't1', status: 'pending' });
      tenantRepository.findGlobalRoleByName.mockResolvedValue({ id: 'r1' });
      tenantRepository.createTenantRole.mockResolvedValue({ id: 'tr1' });
      tenantRepository.cloneRolePermissions.mockResolvedValue();
      userRepository.create.mockResolvedValue({ id: 'u1' });
      tokenService.signEmailVerificationToken.mockReturnValue('token123');
      emailService.sendEmail.mockResolvedValue(true);

      const result = await authService.register({
        company_name: 'Acme',
        subdomain: 'acme',
        name: 'John',
        email: 'john@acme.com',
        password: 'Password1!',
      });

      expect(result).toHaveProperty('tenant_id', 't1');
      expect(result).toHaveProperty('user_id', 'u1');
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    });
  });
});
