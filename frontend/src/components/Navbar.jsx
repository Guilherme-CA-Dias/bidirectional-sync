import React from 'react';
import { NavLink } from 'react-router-dom';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import '../App.css';

function Navbar() {
  return (
    <NavigationMenu.Root className="NavigationMenuRoot">
      <NavigationMenu.List className="NavigationMenuList">
        <NavigationMenu.Item>
          <NavLink to="/" className="NavigationMenuLink">
            Connections
          </NavLink>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavLink to="/companies" className="NavigationMenuLink">
            Companies
          </NavLink>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

export default Navbar;
