import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => {
    const actualReactRouterDom = jest.requireActual('react-router-dom');
    return {
        ...actualReactRouterDom,
        useNavigate: jest.fn(),
        useLocation: jest.fn(),
    };
  });  