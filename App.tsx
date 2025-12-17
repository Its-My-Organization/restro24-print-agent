import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ConfigScreen } from "./src/screens/ConfigScreen";
import { StatusScreen } from "./src/screens/StatusScreen";
import { JobsScreen } from "./src/screens/JobsScreen";

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Tab.Navigator>
        <Tab.Screen 
          name="Config" 
          component={ConfigScreen}
          options={{ title: "Configuration" }}
        />
        <Tab.Screen 
          name="Status" 
          component={StatusScreen}
          options={{ title: "Agent Status" }}
        />
        <Tab.Screen 
          name="Jobs" 
          component={JobsScreen}
          options={{ title: "Print Jobs" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;


